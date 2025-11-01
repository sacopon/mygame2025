import { ActorState, Damage } from "..";

/**
 * 素のダメージ計算
 * 攻撃者の攻撃力 - 被攻撃者の防御力 / 2(0クリップ)
 */
export function calcBaseDamage(attacker: Readonly<ActorState>, defender: Readonly<ActorState>): Damage {
  return Damage.of(Math.max(0, attacker.currentAttack.value - Math.floor(defender.currentDefence.value / 2)));
}
