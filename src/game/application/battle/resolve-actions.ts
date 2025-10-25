import { assertNever } from "@shared/utils";
import { PresentationEffect } from "..";
import { ActionType, ActorId, BattleDomainState, DamageApplied, EnemyGroupId, PlannedAction, SelfDefence } from "@game/domain";
import { RandomPort } from "@game/presentation";

/**
 * 各種判定ロジックをまとめたもの
 */
export type ResolveDeps = {
  random: RandomPort;
  isAlly: (id: ActorId) => boolean;
  aliveAllAllies: () => ReadonlyArray<ActorId>;
  aliveAllEnemies: () => ReadonlyArray<ActorId>;
  aliveEnemiesInGroup: (groupId: EnemyGroupId) => ReadonlyArray<ActorId>;
  aliveAllActors: () => ReadonlyArray<ActorId>;
};

/**
 * Action を(ドメイン処理を用いて)解決し、DomainEvent と PresentationEffect を生成する
 *
 * @param actions 行動内容の配列
 * @returns ドメインイベントとアトミックイベントそれぞれの配列
 */
export function resolveActions(state: Readonly<BattleDomainState>, actions: ReadonlyArray<PlannedAction>, deps: ResolveDeps)
  : {
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

    const { state: nextState, effects } = resolveAction(currentState, action, deps);
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
function resolveAction(currentState: Readonly<BattleDomainState>, action: Readonly<PlannedAction>, deps: ResolveDeps)
  : {
    state: Readonly<BattleDomainState>,
    effects: ReadonlyArray<PresentationEffect>,
  } {
  let nextState: Readonly<BattleDomainState> = currentState;
  const resultEffects: PresentationEffect[] = [];

  switch(action.actionType) {
    case ActionType.Attack: {
        const { state, effects } = createAttackResolution(currentState, action, deps);
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
        return [ action.mode.targetId ];
      }

      if (action.selection.kind === "group") {
        // グループを選択をしている(= 味方の行動であることが型から確定している)
        const list = deps.aliveEnemiesInGroup(action.selection.groupId);
        return 0 < list.length ? [deps.random.shuffle(list)[0]] : [];
      }
      else {
        // 敵の場合
        const allies = state.getAliveAllyActorStates();
        return 0 < allies.length ? [deps.random.shuffle(allies)[0].actorId] : [];
      }

    case "group":
      // グループ攻撃は味方のみ
      return deps.aliveEnemiesInGroup(action.mode.groupId);

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
function createAttackResolution(currentState: Readonly<BattleDomainState>, action: Readonly<PlannedAction>, deps: ResolveDeps)
  : {
    state: Readonly<BattleDomainState>,
    effects: ReadonlyArray<PresentationEffect>,
  } {
  const effects: PresentationEffect[] = [];
  const sourceId = action.actorId;
  const targets = resolveTargets(currentState, action, deps);
  const isPlayerAction = deps.isAlly(sourceId);
  const seEffect: PresentationEffect[] = [];
  seEffect.push(
    { kind: "PlaySe", seId: isPlayerAction ? "player_attack" : "enemy_attack" }
  );
  // TODO: クリティカルの場合は seEffect に追加でクリティカル音

  effects.push(
    // 画面クリア
    { kind: "ClearMessageWindowText" },
    // SE再生
    ...seEffect,
    // 「${actorId}の　こうげき！」を表示
    { kind: "ShowAttackStartedText", actorId: sourceId },
  );

  for (const targetId of targets) {
    const event: DamageApplied = {
      type: "DamageApplied",
      sourceId,
      targetId,
      amount: deps.random.range(10, 30),
      critical: false,
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

  const event = {
    // 防御効果
    type: "SelfDefence",
    sourceId,
  } as const as SelfDefence;

  currentState = currentState.apply(event);

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
  const effects: PresentationEffect[] = [];

  if (isPlayerAttack) {
    effects.push(
      // ダメージ後の状態を適用
      { kind: "ApplyState", state: appliedState },
      // SE再生
      { kind: "PlaySe", seId: "enemy_damage" },
      // 「${actorId}は　${amount}の　ダメージ！
      { kind: "ShowEnemyDamageText", actorId: event.targetId, amount: event.amount },
      // ダメージを受けた敵の点滅
      { kind: "EnemyDamageBlink", actorId: event.targetId },
      // TODO: 死んでいたら(点滅の終了を待って)倒したメッセージが入る
    );
  }
  else {
    effects.push(
      // ダメージ後の状態を適用
      { kind: "ApplyState", state: appliedState },
      // SE再生
      { kind: "PlaySe", seId: "player_damage" },
      // 「${actor.name}は　${amount}の　ダメージを　うけた！」
      { kind: "ShowPlayerDamageText", actorId: event.targetId, amount: event.amount },
      // 画面の揺れ
      { kind: "PlayerDamageShake", actorId: event.targetId },
      // TODO: 死んでいたら(画面揺れの終了を待って)画面を赤くする＆死んだメッセージが入る
    );
  }

  return effects;
}
