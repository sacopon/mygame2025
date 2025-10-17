import { GameObjectAccess, Scene } from "../../scene/core/scene";
import { BattleCommand, CommandChoice } from "./core";
import { BattleSceneContext, BattleSceneState, InputPhaseSelectCommandState } from "./states";
import {
  Background,
  BattleBackground,
  CommandSelectWindow,
  Enemy,
  EnemySelectWindow,
  MainWindow,
  UILayoutCoordinator
} from "../../game-object/elements";
import { SceneContext, SceneId } from "../../scene/core/scene";
import {
  Actor,
  ActorId,
  ActorType,
  Ally,
  AllyActor,
  AllyId,
  EnemyActor,
  EnemyGroupId,
  EnemyId
} from "@game/domain";
import { StateStack } from "@game/shared";
import { ExecutePhaseTurnPlanningState } from "./states/execute-phase";

function createActors(): Actor[] {
  return [
    // 味方
    { actorId: ActorId(1), actorType: ActorType.Ally, originId: AllyId(1) },
    { actorId: ActorId(2), actorType: ActorType.Ally, originId: AllyId(2) },
    { actorId: ActorId(3), actorType: ActorType.Ally, originId: AllyId(3) },
    { actorId: ActorId(4), actorType: ActorType.Ally, originId: AllyId(4) },

    // 敵
    // TODO: 同一 enemyGroupId 内は必ず同一 originId であることをチェックしたい
    { actorId: ActorId(5),  actorType: ActorType.Enemy, originId: EnemyId(4), enemyGroupId: EnemyGroupId(1) },
    { actorId: ActorId(6),  actorType: ActorType.Enemy, originId: EnemyId(1), enemyGroupId: EnemyGroupId(2) },
    { actorId: ActorId(7),  actorType: ActorType.Enemy, originId: EnemyId(1), enemyGroupId: EnemyGroupId(2) },
    { actorId: ActorId(8),  actorType: ActorType.Enemy, originId: EnemyId(4), enemyGroupId: EnemyGroupId(1) },
    { actorId: ActorId(9),  actorType: ActorType.Enemy, originId: EnemyId(1), enemyGroupId: EnemyGroupId(3) },
    { actorId: ActorId(10), actorType: ActorType.Enemy, originId: EnemyId(3), enemyGroupId: EnemyGroupId(4) },
  ];
}

const isAllyActor = (actor: Actor): actor is AllyActor => actor.actorType === ActorType.Ally;
const isEnemyActor = (actor: Actor): actor is EnemyActor => actor.actorType === ActorType.Enemy;

/**
 * バトルシーンクラス
 * バトルシーンのステート遷移を管理
 */
export class BattleScene implements Scene {
  #context!: BattleSceneContext;
  #gameObjectAccess!: GameObjectAccess;
  #stateStack!: StateStack<BattleSceneContext>;
  #allActors!: ReadonlyArray<Actor>;
  #partyAllyCharacters: ReadonlyArray<Ally> = [];
  #actorById!: Map<ActorId, Actor>;
  #allyActorByAllyId!: Map<AllyId, AllyActor>;
  #enemyActorsByGroupId!: Map<EnemyGroupId, EnemyActor[]>;

  onEnter(context: SceneContext) {
    this.#allActors = Object.freeze(createActors());

    // パーティ編成
    this.#partyAllyCharacters = this.#allActors
      .filter(isAllyActor)
      .map(actor => context.domain.allyRepository.findAlly(actor.originId));

    // アクセス簡易化のためのマップ生成
    this.#setupDictionary();

    // コマンド(本当はキャラクターごとにコマンドは異なるが仮で共通)
    const commands = [
      BattleCommand.Attack,
      BattleCommand.Spell,
      BattleCommand.Defence,
      BattleCommand.Item,
    ] as const satisfies readonly BattleCommand[];

    // 敵データ作成

    // 敵画像
    const { width, height } = context.ui.screen.getGameSize();
    context.gameObjectAccess.spawnGameObject(new Background(context.ui, width, height));
    context.gameObjectAccess.spawnGameObject(new BattleBackground(context.ui, width, height));
    context.gameObjectAccess.spawnGameObject(new MainWindow(context.ui, width, height));

    // 一旦全て同じ敵の画像
    // 中央揃えにしたいところだが、ここも仮
    // 敵のグループ定義を厳密に行うようになったら配置情報も合わせて作成する
    for (let i = 0; i < this.#allActors.filter(isEnemyActor).length; ++i) {
      context.gameObjectAccess.spawnGameObject(new Enemy(context.ui, width, height, i));
    }

    const commandSelectWindow = context.gameObjectAccess
      .spawnGameObject(new CommandSelectWindow(context.ui, commands)) as CommandSelectWindow;

    // 敵選択ウィンドウ
    const enemyGroups = [...this.#enemyActorsByGroupId.entries()].map(([groupId, list]) => {
      return {
        enemyGroupId: groupId,
        name: context.domain.enemyRepository.findEnemy(list[0].originId).name,
        count: list.length,
      };
    });
    const enemySelectWindow = context.gameObjectAccess
      .spawnGameObject(new EnemySelectWindow(context.ui, enemyGroups)) as EnemySelectWindow;

    // レイアウトコーディネイター
    context.gameObjectAccess.spawnGameObject(
      new UILayoutCoordinator(
        context.ui, width, height, {
          commandSelectWindow,
          enemySelectWindow,
        })
    );

    this.#gameObjectAccess = context.gameObjectAccess;
    this.#context = {
      ui: context.ui,
      domain: context.domain,
      commandSelectWindow,
      enemySelectWindow,
      commandChoices: [],
    };
    this.#stateStack = new StateStack<BattleSceneContext>(this.#context);

    // コマンド入力フェーズから開始
    this.#startOrNextActor();
  }

  #startOrNextActor(): void {
    // 全員行動確定 -> 実行フェーズへ遷移
    if (this.isAllConfirmed) {
      this.#finishInputPhase();
      return;
    }

    const state = new InputPhaseSelectCommandState(
      this,
      this.currentActor,
      {
        // 決定可能か
        canDecide: _c => true,
        // 決定(確定)時処理
        onDecide: (c) => {
          // コマンドを記録
          this.#addChoice(c);

          // 次の人の番へ
          this.#startOrNextActor();
        },
        // キャンセル可能か
        canCancel: (_: AllyActor) => {
          return 0 < this.progressIndex;
        },
        // キャンセル時処理
        onCancel: (_: AllyActor) => {
          if (this.#context.commandChoices.length === 0) {
            throw new Error("先頭のキャラの行動はキャンセル不可");
          }

          // 決定内容の破棄
          this.#undoChoice();

          // 前の人の番へ
          this.#startOrNextActor();
        },
      });

    this.#open(state);
  }

  next(): SceneId {
    throw new Error("next: Method not implemented.");
  }

  update(deltaTime: number): boolean {
    if (!this.#stateStack.hasAny()) {
      // TODO: シーン終了
      return true;
    }

    // ステートの処理を実行
    this.#stateStack.update(deltaTime);

    if (!this.#stateStack.hasAny()) {
      // TODO: シーン終了
      return true;
    }

    return false;
  }

  get isAllConfirmed(): boolean {
    return this.#partyAllyCharacters.length <= this.progressIndex;
  }

  get progressIndex(): number {
    return this.#context.commandChoices.length;
  }

  get currentActor(): AllyActor {
    if (this.isAllConfirmed) {
      throw new Error("currentActor: no actor (all confirmed)");
    }

    const allyId = this.#partyAllyCharacters[this.progressIndex].allyId;
    const ally = this.#getAllyActorByAllyId(allyId);

    if (!ally) {
      throw new Error(`currentActor: no actor (not found: ${allyId})`);
    }

    return ally;
  }

  requestPushState(state: BattleSceneState): void {
    this.#stateStack.requestPush(state);
  }

  requestPopState(): void {
    this.#stateStack.requestPop();
  }

  requestReplaceTopState(state: BattleSceneState): void {
    this.#stateStack.requestReplaceTop(state);
  }

  requestRewindTo(depth: number): void {
    this.#stateStack.requestRewindTo(depth);
  }

  markState(): number {
    return this.#stateStack.mark();
  }

  #open(state: BattleSceneState): void {
    if (this.#stateStack.hasAny()) {
      this.#stateStack.requestPush(state);
    }
    else {
      this.#stateStack.push(state);
    }
  }

  /**
   * 入力フェーズ完了時
   */
  #finishInputPhase(): void {
    this.#context.commandSelectWindow.setActive(false);
    this.#gameObjectAccess.despawnGameObject(this.#context.commandSelectWindow);

    this.#context.enemySelectWindow.setActive(false);
    this.#gameObjectAccess.despawnGameObject(this.#context.enemySelectWindow);

    this.#moveToExecutePhase();
  }

  /**
   * 実行フェーズへの遷移
   */
  #moveToExecutePhase(): void {
    this.#stateStack.requestPush(new ExecutePhaseTurnPlanningState(this));
  }

  /**
   * コマンド選択の結果を追加
   */
  #addChoice(c: CommandChoice): void {
    this.#context.commandChoices = [...this.#context.commandChoices, c];
  }

  /**
   * コマンド選択の結果を1つ戻す
   */
  #undoChoice(): void {
    this.#context.commandChoices = this.#context.commandChoices.slice(0, -1);
  }

  /**
   * コマンド選択の結果をクリア
   */
  #resetCommandChoice(): void {
    this.#context.commandChoices = [];
  }

  #getAllyActorByAllyId(allyId: AllyId): AllyActor {
    const actor = this.#allyActorByAllyId.get(allyId);

    if (!actor) {
      throw new Error(`getAllyActorByAllyId: Actor is not found (allyId:${allyId})`);
    }

    return actor;
  }

  #getAllyNameByActorId(id: ActorId): string {
    const actor = this.#actorById.get(id) as AllyActor | undefined;

    if (!actor || actor.actorType !== ActorType.Ally) {
      throw new Error(`getAllyNameByActorId: Ally not found (actorId:${id})`);
    }

    return this.#context.domain.allyRepository.findAlly(actor.originId).name;
  }

  #getEnemyNameByGroupId(groupId: EnemyGroupId): string {
    const list = this.#enemyActorsByGroupId.get(groupId);

    if (!list || list.length === 0) {
      throw new Error(`getEnemyNameByGroupId: Enemy group not found or empty (groupId:${groupId})`);
    }

    return this.#context.domain.enemyRepository.findEnemy(list[0].originId).name;
  }

  #setupDictionary() {
    // 全アクター
    this.#actorById = new Map<ActorId, Actor>(this.#allActors.map(actor => [actor.actorId, actor]));

    // 味方
    this.#allyActorByAllyId = new Map<AllyId, AllyActor>((this.#allActors
      .filter(actor => actor.actorType === ActorType.Ally) as AllyActor[])
      .map(actor => [actor.originId, actor]));

    // 敵
    this.#enemyActorsByGroupId = new Map<EnemyGroupId, EnemyActor[]>();
    for (const actor of this.#allActors.filter(isEnemyActor)) {
      const list = this.#enemyActorsByGroupId.get(actor.enemyGroupId);
      if (!list) {
        this.#enemyActorsByGroupId.set(actor.enemyGroupId, [actor]);
      }
      else {
        list.push(actor);
      }
    }
  }
}
