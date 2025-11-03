import { ActorState, Damage, TurnSnapshot } from "..";

/**
 * 素のダメージ計算
 * 攻撃者の攻撃力 - 被攻撃者の防御力 / 2(0クリップ)
 */
export function calcBaseDamage(
  attacker: Readonly<ActorState>,
  defender: Readonly<ActorState>,
  turn: TurnSnapshot,
  isCritical: boolean): Damage {
  const defence = isCritical ? 0 : defender.currentDefence.value;
  let baseDamageAmount = Math.max(0, attacker.currentAttack.value - Math.floor(defence / 2));

  if (turn.defendingActorIds.has(defender.actorId)) {
    baseDamageAmount /= 2;
  }

  return Damage.of(Math.floor(baseDamageAmount));
}
