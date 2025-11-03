import { assertNever } from "@shared/utils";
import { PresentationEffect, rollCritical } from "..";
import {
  ActionType,
  Actor,
  ActorId,
  BattleDomainState,
  calcBaseDamage,
  DamageApplied,
  EnemyGroupId,
  isAlive,
  PlannedAction,
  TurnSnapshot
} from "@game/domain";
import { RandomPort } from "@game/presentation";

/**
 * 各種判定ロジックをまとめたもの
 */
export type ResolveDeps = {
  random: RandomPort;
  getActor: (id: ActorId) => Actor;
  isAlly: (id: ActorId) => boolean;
  aliveAllAllies: () => ReadonlyArray<ActorId>;
  aliveAllEnemies: () => ReadonlyArray<ActorId>;
  getActorIdsByEnemyGroup: (groupId: EnemyGroupId) => ReadonlyArray<ActorId>;
  aliveAllActors: () => ReadonlyArray<ActorId>;
};

/**
 * Action を(ドメイン処理を用いて)解決し、DomainEvent と PresentationEffect を生成する
 *
 * @param actions 行動内容の配列
 * @returns ドメインイベントとアトミックイベントそれぞれの配列
 */
export function resolveActions(
  state: Readonly<BattleDomainState>,
  turn: Readonly<TurnSnapshot>,
  actions: ReadonlyArray<PlannedAction>,
  deps: ResolveDeps
) : {
  state: Readonly<BattleDomainState>,
  effects: ReadonlyArray<PresentationEffect>,
} {
  const resultEffects: PresentationEffect[] = [];
  let currentState = state;

  for (const action of actions) {
    // 死んでいるキャラクターの Action は無視
    if (currentState.isDead(action.actorId)) {
      continue;
    }

    const { state: nextState, effects } = resolveAction(currentState, turn, action, deps);
    currentState = nextState;
    resultEffects.push(...effects);
  }

  return { state: currentState, effects: resultEffects };
}

/**
 * 1件の Action を処理し、対応する DomainEvent と PresentationEffect 列を作り出す
 *
 * @param action 行動内容
 * @returns どうかけば良いのか
 */
function resolveAction(currentState: Readonly<BattleDomainState>, turn: Readonly<TurnSnapshot>, action: Readonly<PlannedAction>, deps: ResolveDeps)
  : {
    state: Readonly<BattleDomainState>,
    effects: ReadonlyArray<PresentationEffect>,
  } {
  let nextState: Readonly<BattleDomainState> = currentState;
  const resultEffects: PresentationEffect[] = [];

  switch(action.actionType) {
    case ActionType.Attack: {
        const { state, effects } = createAttackResolution(currentState, turn, action, deps);
        nextState = state;
        resultEffects.push(...effects);
      }
      break;

    case ActionType.SelfDefence: {
        const { state, effects } = createEffectsFromSelfDefence(currentState, action);
        nextState = state;
        resultEffects.push(...effects);
      }
      break;

    case ActionType.Spell:
    case ActionType.Item:
      // TODO
      break;

    default:
      assertNever(action);
  }

  return { state: nextState, effects: resultEffects };
}

/**
 * 行動内容から、実際のターゲットを決定する
 *
 * @param action 行動内容
 * @returns 決定された具体的な対象(配列)、1体の場合でも配列で戻す
 */
function resolveTargets(state: Readonly<BattleDomainState>, action: Readonly<PlannedAction>, deps: ResolveDeps): ReadonlyArray<ActorId> {
  switch (action.mode.kind) {
    case "single":
      // すでに決まっていたらその内容で確定する
      if (action.mode.targetId) {
        if (state.isAlive(action.mode.targetId)) {
          // 生きていればそれで確定
          return [ action.mode.targetId ];
        }
        else if (deps.isAlly(action.actorId)) {
          // 味方の攻撃、生存している敵をひとり選択
          return [deps.random.shuffle(state.getAliveEnemyActorIds())[0]];
        }
        else {
          // 敵の攻撃、生存している味方をひとり選択
          return [deps.random.shuffle(state.getAliveAllyActorIds())[0]];
        }
      }

      if (action.selection.kind === "group") {
        // グループ選択 で 対象は1人(= 味方の行動であることが型から確定している)
        const list = deps
          .getActorIdsByEnemyGroup(action.selection.groupId)
          .filter(id => isAlive(state.getActorState(id)));

        if (0 < list.length) {
          // グループ内に生存者がいればその中からランダム
          return [deps.random.shuffle(list)[0]];
        }
        else {
          // そのグループが全滅している
          const list = state.getAliveEnemyActorIds();
          // 全体からランダム、全体がそもそも全滅している場合は空の配列
          return 0 < list.length ? [deps.random.shuffle(list)[0]] : [];
        }
      }
      else {
        // 敵の場合
        const allies = state.getAliveAllyActorIds();
        return 0 < allies.length ? [deps.random.shuffle(allies)[0]] : [];
      }

    case "group":
      // グループ攻撃は味方のみ
      const list = deps
        .getActorIdsByEnemyGroup(action.mode.groupId)
        .filter(id => isAlive(state.getActorState(id)));
      return 0 < list.length ? list : [];

    case "all":
      return deps.isAlly(action.actorId) ? deps.aliveAllEnemies() : deps.aliveAllAllies();

    case "none":
      return [];

    default:
      return assertNever(action.mode);
  }
}

/**
 * actionType: Attack の行動について、DomainEvent と PresentationEffect に解決する
 *
 * @param action 行動内容(actionType: Attack)
 * @returns どうかけば良いのか
 */
function createAttackResolution(currentState: Readonly<BattleDomainState>, turn: Readonly<TurnSnapshot>, action: Readonly<PlannedAction>, deps: ResolveDeps)
  : {
    state: Readonly<BattleDomainState>,
    effects: ReadonlyArray<PresentationEffect>,
  } {
  const effects: PresentationEffect[] = [];
  const sourceId = action.actorId;
  const targets = resolveTargets(currentState, action, deps);
  const isPlayerAttack = deps.isAlly(action.actorId);

  // 攻撃ヘッダ共通部分
  effects.push(
    { kind: "ClearMessageWindowText" },
    { kind: "PlaySe", seId: isPlayerAttack ? "player_attack" : "enemy_attack" },
    { kind: "ShowAttackStartedText", actorId: sourceId },
  );

  for (const targetId of targets) {
    // クリティカル発生有無
    const isCritical = rollCritical(
      currentState,
      sourceId,
      {
        random: deps.random,
        isAlly: deps.isAlly,
        getActor: deps.getActor,
      }
    );

    // 基礎ダメージ計算
    const baseDamage = calcBaseDamage(
      currentState.getActorState(action.actorId),
      currentState.getActorState(targetId),
      turn,
      isCritical);

    // ブレ(一律+-10%固定)
    // TODO: 器用さが高いとブレが少ない、とかにするか？
    const varianceRatio = 0.9 + deps.random.range(0, 20) / 100; // 0.9〜1.1
    const amount = Math.floor(baseDamage.value * varianceRatio);

    const event: DamageApplied = {
      type: "DamageApplied",
      sourceId,
      targetId,
      amount,
      critical: isCritical,
    };

    currentState = currentState.apply(event);
    effects.push(...createEffectsFromDamageApplied(currentState, event, deps));
  }

  return { state: currentState.clone(), effects };
}

/**
 * actionType: SelfDefence の行動について、DomainEvent と PresentationEffect に解決する
 *
 * @param action 行動内容(actionType: SelfDefence)
 * @returns どうかけば良いのか
 */
function createEffectsFromSelfDefence(currentState: Readonly<BattleDomainState>, action: Readonly<PlannedAction>)
  : {
    state: Readonly<BattleDomainState>,
    effects: ReadonlyArray<PresentationEffect>,
  } {
  const effects: PresentationEffect[] = [];
  const sourceId = action.actorId;

  effects.push(
    // 画面クリア
    { kind: "ClearMessageWindowText" },
    // 状態反映
    { kind: "ApplyState", state: currentState },
    // 「${actorId}は　みをまもっている！」を表示
    { kind: "ShowSelfDefenceText", actorId: sourceId },
  );

  return { state: currentState, effects };
}

/**
 * ドメインイベント DamageApplied に対応した PresentationEffect を生成する
 *
 * @param event DamageApplied イベントの内容
 * @returns PresentationEffect の配列
 */
function createEffectsFromDamageApplied(appliedState: Readonly<BattleDomainState>, event: DamageApplied, deps: ResolveDeps): ReadonlyArray<PresentationEffect> {
  const isPlayerAttack = deps.isAlly(event.sourceId);
  const isNoDamage = event.amount === 0;
  const effects: PresentationEffect[] = [];

  // ノーダメージ時
  if (isNoDamage) {
    effects.push(
      // SE再生
      { kind: "PlaySe", seId: "miss" },
      // 「ミス！
      //   ${actorId}に　ダメージを　与えられない！」
      { kind: "ShowMissText" },
      { kind: "ShowNoDamageText", actorId: event.targetId },
    );

    // ダメージ後の状態を適用
    effects.push({ kind: "ApplyState", state: appliedState });
    return effects;
  }

  // 会心/痛恨の一撃
  if (event.critical) {
    effects.push(
      // SE
      { kind: "PlaySe", seId: "critical" },
      // ウェイト
      // メッセージ（会心の一撃）
      // 「会心の　いちげき！」or「痛恨の　いちげき！」
      { kind: isPlayerAttack ? "ShowPlayerCriticalText" : "ShowEnemyCriticalText" },
    );
  }

  effects.push(
    // ダメージ後の状態を適用
    { kind: "ApplyState", state: appliedState },
  );

  if (isPlayerAttack) {
    effects.push(
      // SE再生
      { kind: "PlaySe", seId: "enemy_damage" },
      // 「${actorId}は　${amount}の　ダメージ！
      { kind: "ShowEnemyDamageText", actorId: event.targetId, amount: event.amount },
      // ダメージを受けた敵の点滅
      { kind: "EnemyDamageBlink", actorId: event.targetId },
    );

    if (appliedState.isDead(event.targetId)) {
      // 敵消去
      effects.push({ kind: "EnemyHideByDefeat", actorId: event.targetId });
      // (もしウィンドウいっぱいなら)最終行消去
      effects.push({ kind: "ClearLastText" });
      // 「${actor.name}を　たおした！」
      effects.push({ kind: "ShowDefeatText", actorId: event.targetId });
    }
  }
  else {
    effects.push(
      // SE再生
      { kind: "PlaySe", seId: "player_damage" },
      // 「${actor.name}は　${amount}の　ダメージを　うけた！」
      { kind: "ShowPlayerDamageText", actorId: event.targetId, amount: event.amount },
      // 画面の揺れ
      { kind: "PlayerDamageShake", actorId: event.targetId },
    );

    if (appliedState.isDead(event.targetId)) {
      // (もしウィンドウいっぱいなら)最終行消去
      effects.push({ kind: "ClearLastText" });
      // 「${actor.name}は　しんでしまった！」
      effects.push({ kind: "ShowDeadText", actorId: event.targetId });
    }
  }

  return effects;
}
