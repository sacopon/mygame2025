import { Scene } from "../../scene/core/scene";
import { BattleCommand, BattleSceneState, CommandChoice, InputPhaseFlowState, TurnPlan, TurnResolution } from ".";
import { UiPorts, GameObjectAccess, BattleMessageWindow } from "../..";
import {
  GameObject,
  Background,
  CommandSelectWindow,
  EnemyView,
  EnemySelectWindow,
  MainWindow,
  SceneContext,
  SceneId,
  UILayoutCoordinator,
} from "../..";
import {
  Actor,
  ActorId,
  ActorType,
  AllyActor,
  AllyId,
  BattleDomainState,
  DomainPorts,
  EnemyActor,
  EnemyGroupId,
  EnemyId,
  isAlive
} from "@game/domain";
import { StateStack } from "@game/shared";
import { StatusWindow } from "@game/presentation/game-object/elements/window/status-window";

/**
 * バトルシーンの共有オブジェクト
 */
export type BattleSceneContext = {
  ui: Readonly<UiPorts>;
  domain: Readonly<DomainPorts>;
  allyActorIds: ReadonlyArray<ActorId>;
  enemyActorIds: ReadonlyArray<ActorId>;

  // バトルのドメイン状態
  domainState: Readonly<BattleDomainState>;
  nextDomainState: Readonly<BattleDomainState>;

  // 入力フェーズでのみ使用する UI オブジェクト
  inputUi?: {
    coordinator: UILayoutCoordinator;
    commandSelectWindow: CommandSelectWindow;
    enemySelectWindow: EnemySelectWindow;
    statusWindow: StatusWindow;
  };

  // 実行フェーズで使用する UI オブジェクト
  executeUi?: {
    coordinator: UILayoutCoordinator;
    messageWindow: BattleMessageWindow;
    statusWindow: StatusWindow;
  }

  // 入力フェーズで設定、実行フェーズで破棄
  commandChoices: ReadonlyArray<CommandChoice>;
  // 実行フェーズで設定、実行フェーズで破棄
  turnPlan?: Readonly<TurnPlan>;
  // 実行フェーズで設定、実行フェーズで破棄
  turnResolution?: Readonly<TurnResolution>;
};

function createActors(): Actor[] {
  return [
    // 味方
    { actorId: ActorId(1), actorType: ActorType.Ally, originId: AllyId(1) },
    { actorId: ActorId(2), actorType: ActorType.Ally, originId: AllyId(2) },
    { actorId: ActorId(3), actorType: ActorType.Ally, originId: AllyId(3) },
    { actorId: ActorId(4), actorType: ActorType.Ally, originId: AllyId(4) },

    // 敵
    // TODO: 同一 enemyGroupId 内は必ず同一 originId であることをチェックしたい
    { actorId: ActorId(5),  actorType: ActorType.Enemy, originId: EnemyId(1), enemyGroupId: EnemyGroupId(1) },
    { actorId: ActorId(6),  actorType: ActorType.Enemy, originId: EnemyId(1), enemyGroupId: EnemyGroupId(1) },
    { actorId: ActorId(7),  actorType: ActorType.Enemy, originId: EnemyId(2), enemyGroupId: EnemyGroupId(2) },
    { actorId: ActorId(8),  actorType: ActorType.Enemy, originId: EnemyId(2), enemyGroupId: EnemyGroupId(2) },
    { actorId: ActorId(9),  actorType: ActorType.Enemy, originId: EnemyId(3), enemyGroupId: EnemyGroupId(3) },
    { actorId: ActorId(10), actorType: ActorType.Enemy, originId: EnemyId(4), enemyGroupId: EnemyGroupId(4) },
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
  #partyAllyActors: ReadonlyArray<AllyActor> = []; // TODO: パーティは Ally ではなく AllyActor で持つ

  // 辞書データキャッシュ
  #allActors!: ReadonlyArray<Actor>;
  #actorById!: Map<ActorId, Actor>;
  #allyActorByAllyId!: Map<Readonly<AllyId>, AllyActor>;
  #enemyActorsByGroupId!: Map<EnemyGroupId, EnemyActor[]>;
  #allAllyActorIds!: ReadonlyArray<ActorId>;
  #allEnemyActorIds!: ReadonlyArray<ActorId>;
  #enemyViewByActorId: Map<ActorId, EnemyView>;

  constructor() {
    this.#enemyViewByActorId = new Map<ActorId, EnemyView>();
  }

  onEnter(context: SceneContext) {
    this.#enemyViewByActorId.clear();
    this.#allActors = Object.freeze(createActors());

    // パーティ編成
    this.#partyAllyActors = this.#allActors
      .filter(isAllyActor);

    // 敵選定
    const enemyActors = this.#allActors.filter(isEnemyActor);

    // ドメインステート作成
    const domainState = BattleDomainState.fromActors(this.#partyAllyActors, enemyActors);

    // アクセス簡易化のためのマップ生成
    this.#setupDictionary();

    // 敵データ作成

    // 敵画像
    const { width, height } = context.ui.screen.getGameSize();
    context.gameObjectAccess.spawnGameObject(new Background(context.ui, width, height));
    context.gameObjectAccess.spawnGameObject(new MainWindow(context.ui, "bgsample.png"));

    // 一旦全て同じ敵の画像
    // 中央揃えにしたいところだが、ここも仮
    // 敵のグループ定義を厳密に行うようになったら配置情報も合わせて作成する
    for (let i = 0; i < enemyActors.length; ++i) {
      const actor = enemyActors[i];
      const go = context.gameObjectAccess.spawnGameObject(new EnemyView(context.ui, actor.originId, width, height, i));
      this.#enemyViewByActorId.set(actor.actorId, go);
    }

    this.#gameObjectAccess = context.gameObjectAccess;
    this.#context = {
      ui: context.ui,
      domain: context.domain,
      allyActorIds: this.#allAllyActorIds,
      enemyActorIds: this.#allEnemyActorIds,
      domainState,
      nextDomainState: domainState,
      commandChoices: [],
      // inputUi は #beginInputPhase() にて作成
    };
    this.#stateStack = new StateStack<BattleSceneContext>(this.#context);
    // 最初は空なのでステートを直push
    this.#stateStack.push(new InputPhaseFlowState(this));

    // BGM開始
    context.ui.audio.playBgm("battle");
  }

  next(): SceneId {
    throw new Error("next: Method not implemented.");
  }

  update(deltaTime: number): boolean {
    // スタックオーバーを監視する
    if (__DEV__) {
      if (6 < this.#stateStack.size) {
        this.#stateStack.dump();
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

  getAlivePartyCharacterCount(): number {
    return this.#context.domainState.getAliveAllyActorStates().length;
  }

  getCurrentActor(index: number): AllyActor {
    const states = this.#context.domainState.getAliveAllyActorStates();
    const allyId = states[index].originId;
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

  spawn<T extends GameObject>(o: T): T {
    return this.#gameObjectAccess.spawnGameObject(o);
  }

  despawn<T extends GameObject>(o: T) {
    try {
      this.#gameObjectAccess.despawnGameObject(o);
    }
    catch (e) {
      console.warn(e);
    }
  }

  /**
   * データに基づいて入力系UIの作成
   */
  buildInputUi(): void {
    const { domain, ui, domainState: state } = this.#context;
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

    const commandSelectWindow = this.spawn(new CommandSelectWindow(ui, commands));

    // 敵選択ウィンドウ
    const enemySelectWindow = this.spawn(new EnemySelectWindow(ui, this.#buildEnemyGroups(domain, state)));

    // ステータスウィンドウ
    const statusWindow = this.spawn(new StatusWindow(ui, this.#context.domainState, true, (actorId: ActorId) => this.getActorDisplayNameById(actorId)));

    // レイアウトコーディネイター
    const coordinator = this.spawn(new UILayoutCoordinator(
      ui, width, height, {
        commandSelectWindow,
        enemySelectWindow,
        statusWindow,
      }));

    // コンテキストに設定
    this.#context.inputUi = { coordinator, commandSelectWindow, enemySelectWindow, statusWindow };
  }

  /**
   * 入力系UIの後始末
   */
  disposeInputUi(): void {
    if (!this.#context.inputUi) {
      return;
    }

    this.despawn(this.#context.inputUi.coordinator);
    this.despawn(this.#context.inputUi.commandSelectWindow);
    this.despawn(this.#context.inputUi.enemySelectWindow);
    this.despawn(this.#context.inputUi.statusWindow);
    this.#context.inputUi = undefined;
  }

  getActorById(actorId: ActorId): Actor {
    const actor = this.#actorById.get(actorId);

    if (!actor) {
      throw new Error(`getActorById: actor not found:ActorId[${actorId}]`);
    }

    return actor;
  }

  getActorDisplayNameById(actorId: ActorId): string {
    const actor = this.getActorById(actorId);

    if (isAllyActor(actor)) {
      return this.#context.domain.allyRepository.findAlly(actor.originId).name;
    } else {
      // TODO: A, B, C... 個体識別子を付与する場合は同一 enemyId 内での actorId 順で割り振る
      return this.#context.domain.enemyRepository.findEnemy(actor.originId).name;
    }
  }

  getAliveAllies(): ReadonlyArray<ActorId> {
    // TODO: 生死判定
    return this.#allAllyActorIds;
  }

  getAliveEnemies(): ReadonlyArray<ActorId> {
    // TODO: 生死判定
    return this.#allEnemyActorIds;
  }

  getAliveAllActors(): ReadonlyArray<ActorId> {
    // TODO: 生死判定
    return [...this.#allAllyActorIds, ...this.#allEnemyActorIds];
  }

  getActorIdsByEnemyGroup(groupId: EnemyGroupId): ReadonlyArray<ActorId> {
    if (!this.#enemyActorsByGroupId.has(groupId)) {
      return [];
    }

    return this.#enemyActorsByGroupId
      .get(groupId)!
      .map(a => a.actorId);
  }

  getEnemyViewByActorId(actorId: ActorId): EnemyView {
    if (!this.#enemyViewByActorId.has(actorId)) {
      throw new Error(`BattleScene: enemy view not found[${actorId}]`);
    }
    return this.#enemyViewByActorId.get(actorId)!;
  }

  #buildEnemyGroups(domain: Readonly<DomainPorts>, state: Readonly<BattleDomainState>)
    : {
      enemyGroupId: EnemyGroupId,
      name: string
      count: number,
      }[]
  {
    const enemyGroups: { enemyGroupId: EnemyGroupId, name: string, count: number }[] = [];

    for (const entry of this.#enemyActorsByGroupId.entries()) {
      const groupId = entry[0];
      const list = entry[1];
      const aliveList = list.filter(actor => isAlive(state.getActorState(actor.actorId)));

      if (0 < aliveList.length) {
        enemyGroups.push({
          enemyGroupId: groupId,
          name: domain.enemyRepository.findEnemy(aliveList[0].originId).name,
          count: aliveList.length,
        });
      }
    }

    return enemyGroups;
  }

  #getAllyActorByAllyId(allyId: Readonly<AllyId>): AllyActor {
    const actor = this.#allyActorByAllyId.get(allyId);

    if (!actor) {
      throw new Error(`getAllyActorByAllyId: Actor is not found (allyId:${allyId})`);
    }

    return actor;
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
    if (!this.#partyAllyActors || this.#partyAllyActors.length === 0) {
      throw new Error("setupDictionary: BattleScene#partyAllyCharacters not set yet");
    }

    // 味方のアクターID
    this.#allAllyActorIds = Object.freeze(this.#partyAllyActors.map(a => a.originId).map(aid => this.#getAllyActorByAllyId(aid).actorId));
    // 敵のアクターID
    this.#allEnemyActorIds = Object.freeze(Array.from(this.#enemyActorsByGroupId.values()).flat().map(e => e.actorId));
  }
}
