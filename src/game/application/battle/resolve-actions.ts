import { assertNever } from "@shared/utils";
import { AtomicEffect } from "..";
import { ActionType, ActorId, DamageApplied, DomainEvent, EnemyGroupId, PlannedAction } from "@game/domain";

const FIXED_DAMAGE = 999;

/**
 * 各種判定ロジックをまとめたもの
 */
export type ResolveDeps = {
  isAlly: (id: ActorId) => boolean;
  aliveAllAllies: () => ReadonlyArray<ActorId>;
  aliveAllEnemies: () => ReadonlyArray<ActorId>;
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
      assertNever(action);
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
  switch (action.mode.kind) {
    case "single":
      // すでに決まっていたらその内容で確定する
      if (action.mode.targetId) return [ action.mode.targetId ];

      if (action.selection.kind === "group") {
        // グループを選択をしている(= 味方の行動であることが型から確定している)
        // TODO: 現状ではグループ内の先頭に対象を固定
        const list = deps.aliveEnemiesInGroup(action.selection.groupId);
        return 0 < list.length ? [list[0]] : [];
      }
      else {
        // 敵の場合
        const allies = deps.aliveAllAllies();
        // TODO: 現状では味方の先頭に対象を固定
        return 0 < allies.length ? [allies[0]] : [];
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

  // // TODO: とりあえずダメージ演出確認のため、プレイヤーの攻撃以外はスキップ
  // if (!isPlayerAction) { return { events: [], effects: [] }; }

  const seEffect: AtomicEffect[] = [];
  seEffect.push(
    { kind: "PlaySe", seId: isPlayerAction ? "player_attack" : "enemy_attack" }
  );
  // TODO: クリティカルの場合は seEffect に追加でクリティカル音

  effects.push(
    // 画面クリア
    { kind: "ClearMessage" },
    // SE再生
    ...seEffect,
    // 「${actorId}の　こうげき！」を表示
    { kind: "AttackStarted", actorId: sourceId },
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
