import { GameObjectAccess, Scene } from "../../scene/core/scene";
import { BattleCommand, CommandChoice } from "./core";
import { BattleSceneContext, BattleSceneState, InputPhaseFlowState, InputPhaseSelectCommandState } from "./states";
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
  DomainPorts,
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
  #partyAllyCharacters: ReadonlyArray<Ally> = [];
  // 実行フェーズ -> 入力フェーズへ戻る際のマーカー
  #markAtExecutePhase?: number;

  // 辞書データキャッシュ
  #allActors!: ReadonlyArray<Actor>;
  #actorById!: Map<ActorId, Actor>;
  #allyActorByAllyId!: Map<AllyId, AllyActor>;
  #enemyActorsByGroupId!: Map<EnemyGroupId, EnemyActor[]>;
  #allAllyActorIds!: ReadonlyArray<ActorId>;
  #allEnemyActorIds!: ReadonlyArray<ActorId>;

  // ラッパー
  beginInputPhase(): void { this.#beginInputPhase(); }
  endInputPhase(): void { this.#endInputPhase(); }

  onEnter(context: SceneContext) {
    this.#allActors = Object.freeze(createActors());

    // パーティ編成
    this.#partyAllyCharacters = this.#allActors
      .filter(isAllyActor)
      .map(actor => context.domain.allyRepository.findAlly(actor.originId));

    // アクセス簡易化のためのマップ生成
    this.#setupDictionary();

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

    this.#gameObjectAccess = context.gameObjectAccess;
    this.#context = {
      ui: context.ui,
      domain: context.domain,
      allyActorIds: this.#allAllyActorIds,
      enemyActorIds: this.#allEnemyActorIds,
      commandChoices: [],
      // inputUi は #beginInputPhase() にて作成
    };
    this.#stateStack = new StateStack<BattleSceneContext>(this.#context);
    // 最初は空なのでステートを直push
    this.#stateStack.push(new InputPhaseFlowState(this));
  }

  #startOrNextActor(): void {
    // 全員行動確定 -> 実行フェーズへ遷移
    if (this.isAllConfirmed) {
      this.#endInputPhase();
      return;
    }

    const state = new InputPhaseSelectCommandState(
      this,
      this.#context.inputUi!.commandSelectWindow,
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
    // スタックオーバーを監視する
    if (process.env.NODE_ENV !== "production") {
      if (6 < this.#stateStack.size) {
        console.log(this.#stateStack.dump());
        throw new Error("update: BattleScen#stateStack size over 6");
      }
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

  returnToInputPhaseForNextTurn(): void {
    // フェーズを入力フェーズに差し替え
    // InputPhaseFlowState の onEnter にて beginInputPhase が呼ばれる
    this.requestReplaceTopState(new InputPhaseFlowState(this));
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
   * 入力フェーズ開始
   */
  #beginInputPhase(): void {
    const { domain, ui } = this.#context;
    const { width, height } = ui.screen.getGameSize();

    // ロジックエラー
    if (this.#context.inputUi) {
      throw new Error("#beginInputPhase: this.#context.inputUi already exists.");
    }

    // コマンド(本当はキャラクターごとにコマンドは異なるが仮で共通)
    const commands = [
      BattleCommand.Attack,
      BattleCommand.Spell,
      BattleCommand.Defence,
      BattleCommand.Item,
    ] as const satisfies readonly BattleCommand[];

    const commandSelectWindow = this.#gameObjectAccess
      .spawnGameObject(new CommandSelectWindow(ui, commands));

    // 敵選択ウィンドウ
    const enemySelectWindow = this.#gameObjectAccess
      .spawnGameObject(new EnemySelectWindow(ui, this.#buildEnemyGroups(domain)));

    // レイアウトコーディネイター
    const coordinator = this.#gameObjectAccess.spawnGameObject(
      new UILayoutCoordinator(ui, width, height, {
        commandSelectWindow,
        enemySelectWindow,
      }));

    this.#context.inputUi = { coordinator, commandSelectWindow, enemySelectWindow };
    this.#resetCommandChoice();
    this.#startOrNextActor();
  }

  /**
   * 入力フェーズ完了時
   */
  #endInputPhase(): void {
    console.table(this.#context.commandChoices.map(c => ({ ...c, targetJson: JSON.stringify(c.target) })));

    this.#cleanUpInputContext();
    this.#moveToExecutePhase();
  }

  #buildEnemyGroups(domain: Readonly<DomainPorts>) {
    return [...this.#enemyActorsByGroupId.entries()].map(([groupId, list]) => {
      return {
        enemyGroupId: groupId,
        name: domain.enemyRepository.findEnemy(list[0].originId).name,
        count: list.length,
      };
    });
  }

  /**
   * コンテキストに含まれる入力関係のオブジェクトの後始末
   */
  #cleanUpInputContext(): void {
    if (!this.#context.inputUi) {
      return;
    }

    const ui = this.#context.inputUi;
    const safe = (f: () => void) => { try { f(); } catch (e) { console.warn(e); } };

    safe(() => this.#gameObjectAccess.despawnGameObject(ui.coordinator));
    safe(() => this.#gameObjectAccess.despawnGameObject(ui.commandSelectWindow));
    safe(() => this.#gameObjectAccess.despawnGameObject(ui.enemySelectWindow));
    this.#context.inputUi = undefined;
  }

  /**
   * 実行フェーズへの遷移
   */
  #moveToExecutePhase(): void {
    this.#stateStack.requestReplaceTop(new ExecutePhaseTurnPlanningState(this));
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
   * 実行フェーズの完了時に呼び出す
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

    if (!list.every(e => e.originId === list[0].originId)) {
      throw new Error(`getEnemyNameByGroupId: Enemy group contains multiple enemy types (groupId:${groupId})`);
    }

    return this.#context.domain.enemyRepository.findEnemy(list[0].originId).name;
  }

  #setupDictionary() {
    // 全アクター
    this.#actorById = new Map<ActorId, Actor>(this.#allActors.map(actor => [actor.actorId, actor]));

    // 味方
    this.#allyActorByAllyId = new Map<AllyId, AllyActor>(
      this.#allActors
        .filter(isAllyActor)
        .map(actor => [actor.originId, actor])
    );

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

    // アクターIDのキャッシュ
    // 種類別アクターのキャッシュを利用するので、最後に作成すること
    if (!this.#partyAllyCharacters || this.#partyAllyCharacters.length === 0) {
      throw new Error("setupDictionary: BattleScene#partyAllyCharacters not set yet");
    }

    // 味方のアクターID
    this.#allAllyActorIds = Object.freeze(this.#partyAllyCharacters.map(a => a.allyId).map(aid => this.#getAllyActorByAllyId(aid).actorId));
    // 敵のアクターID
    this.#allEnemyActorIds = Object.freeze(Array.from(this.#enemyActorsByGroupId.values()).flat().map(e => e.actorId));
  }
}
