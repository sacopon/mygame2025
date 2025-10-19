import { assertNever } from "@shared/utils";
import { AtomicEffect } from "..";
import { ActionType, ActorId, DamageApplied, DomainEvent, EnemyGroupId, isAllMode, isAttack, isGroupMode, isNoneMode, isSingleMode, PlannedAction } from "@game/domain";

const FIXED_DAMAGE = 12;

/**
 * 各種判定ロジックをまとめたもの
 */
export type ResolveDeps = {
  isAlly: (id: ActorId) => boolean;
  aliveEnemiesInGroup: (groupId: EnemyGroupId) => ReadonlyArray<ActorId>;
  aliveAllActors: () => ReadonlyArray<ActorId>;
};

/**
 * Action を(ドメイン処理を用いて)解決し、DomainEvent と AtomicEffect を生成する
 *
 * @param actions 行動内容の配列
 * @returns ドメインイベントとアトミックイベントそれぞれの配列
 */
export function resolveActions(actions: ReadonlyArray<PlannedAction>, deps: ResolveDeps)
  : {
    events: ReadonlyArray<DomainEvent>,
    effects: ReadonlyArray<AtomicEffect>,
  } {
  const resultEvents: DomainEvent[] = [];
  const resultEffects: AtomicEffect[] = [];

  for (const action of actions) {
    const { events, effects } = resolveAction(action, deps);
    resultEvents.push(...events);
    resultEffects.push(...effects);
  }

  return { events: resultEvents, effects: resultEffects };
}

/**
 * 1件の Action を処理し、対応する DomainEvent と AtomicEffect 列を作り出す
 *
 * @param action 行動内容
 * @returns どうかけば良いのか
 */
function resolveAction(action: Readonly<PlannedAction>, deps: ResolveDeps)
  : {
    events: ReadonlyArray<DomainEvent>,
    effects: ReadonlyArray<AtomicEffect>,
  } {
  const resultEvents: DomainEvent[] = [];
  const resultEffects: AtomicEffect[] = [];

  switch(action.actionType) {
    case ActionType.Attack:
      const { events, effects } = createAttackResolution(action, deps);
      resultEvents.push(...events);
      resultEffects.push(...effects);
      break;

    case ActionType.SelfDefence:
    case ActionType.Spell:
    case ActionType.Item:
      // TODO
      break;

    default:
      assertNever(action.actionType);
  }

  return { events: resultEvents, effects: resultEffects };
}

/**
 * 行動内容から、実際のターゲットを決定する
 *
 * @param action 行動内容
 * @returns 決定された具体的な対象(配列)、1体の場合でも配列で戻す
 */
function resolveTargets(action: Readonly<PlannedAction>, deps: ResolveDeps): ReadonlyArray<ActorId> {
  if (!isAttack(action)) {
      throw new Error("invalid Action");
  }

  if (isSingleMode(action.mode)) {
    // ここでは既に決まっていることになっているが、このタイミングで決める？
    // その場合型としては targetId はオプショナル？
    return [ action.mode.targetId ];
  }
  else if (isGroupMode(action.mode)) {
    // ここの時点で kind: "group" が使用されるのは
    // プレイヤー側のグループ攻撃のみのため、指定されたグループIDの敵を返す
    return deps.aliveEnemiesInGroup(action.mode.groupId);
  }
  else if (isAllMode(action.mode)) {
    return deps.aliveAllActors();
  }
  else if (isNoneMode(action.mode)) {
    return [];
  }

  throw new Error(`invalid Action: action.mode[${action.mode}]`);
}

/**
 * actionType: Attack の行動について、DomainEvent と AtomicEffect に解決する
 *
 * @param action 行動内容(actionType: Attack)
 * @returns どうかけば良いのか
 */
function createAttackResolution(action: Readonly<PlannedAction>, deps: ResolveDeps)
  : {
    events: ReadonlyArray<DomainEvent>,
    effects: ReadonlyArray<AtomicEffect>,
  } {
  const events: DomainEvent[] = [];
  const effects: AtomicEffect[] = [];
  const sourceId = action.actorId;
  const targets = resolveTargets(action, deps);
  const isPlayerAction = deps.isAlly(sourceId);

  effects.push(
    // 「${actorId}の　こうげき！」を表示
    { kind: "AttackStarted", actorId: sourceId },
    // SE再生
    // TODO: クリティカルの場合はまた別の音(ただし、クリティカルかどうかは DamageApplied を生成しなければわからない)
    { kind: "PlaySe", seId: isPlayerAction ? "player_attack" : "enemy_attack" },
  );

  for (const targetId of targets) {
    const event: DamageApplied = {
      type: "DamageApplied",
      sourceId,
      targetId,
      amount: FIXED_DAMAGE,
      critical: false,
    };

    events.push(event);
    effects.push(...createEffectsFromDamageApplied(event, deps));
  }

  return { events, effects };
}

/**
 * ドメインイベント DamageApplied に対応した AtomicEffect を生成する
 *
 * @param event DamageApplied イベントの内容
 * @returns AtomicEffect の配列
 */
function createEffectsFromDamageApplied(event: DamageApplied, deps: ResolveDeps): ReadonlyArray<AtomicEffect> {
  const isPlayerAttack = deps.isAlly(event.sourceId);
  const effects: AtomicEffect[] = [];

  if (isPlayerAttack) {
    effects.push(
      // ダメージを受けた敵の点滅
      { kind: "EnemyDamageBlink", actorId: event.targetId },
      // 「${actorId}は　${amount}の　ダメージ！
      { kind: "ShowEnemyDamageText", actorId: event.targetId, amount: event.amount },
      // TODO: 死んでいたら(点滅の終了を待って)倒したメッセージが入る
    );
  }
  else {
    effects.push(
      // 画面の揺れ
      { kind: "PlayerDamageShake", actorId: event.targetId },
      // 「${actor.name}は　${amount}の　ダメージを　うけた！」
      { kind: "ShowPlayerDamageText", actorId: event.targetId, amount: event.amount },
      // TODO: 死んでいたら(画面揺れの終了を待って)画面を赤くする＆死んだメッセージが入る
    );
  }

  return effects;
}
