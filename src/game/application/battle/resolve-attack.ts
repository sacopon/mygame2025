import { AttackPlannedAction, BattleDomainState, calcBaseDamage, DamageApplied, TurnSnapshot } from "@game/domain";
import { ResolveDeps } from "./resolve-types";
import { PresentationEffect, rollCritical } from "..";
import { createEffectsFromDamageApplied, resolveAttackTargets } from "./resolve-common";

/**
 * actionType: Attack の行動について、DomainEvent と PresentationEffect に解決する
 *
 * @param action 行動内容(actionType: Attack)
 * @returns どうかけば良いのか
 */
export function createAttackResolution(currentState: Readonly<BattleDomainState>, turn: Readonly<TurnSnapshot>, action: Readonly<AttackPlannedAction>, deps: ResolveDeps)
  : {
    state: Readonly<BattleDomainState>,
    effects: ReadonlyArray<PresentationEffect>,
  } {
  const effects: PresentationEffect[] = [];
  const sourceId = action.actorId;
  const targets = resolveAttackTargets(currentState, action, deps);
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
