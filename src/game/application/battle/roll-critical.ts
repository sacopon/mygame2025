import { Actor, ActorId, BattleDomainState } from "@game/domain";
import { RandomPort } from "@game/presentation";

type Deps = {
  random: RandomPort,
  isAlly: (id: ActorId) => boolean,
  getActor: (id: ActorId) => Actor,
};

export function rollCritical(state: Readonly<BattleDomainState>, attacker: ActorId, deps: Deps): boolean {
  // ビッグベアーだけ 1/2 の確率でクリティカル(TEST)
  const bigBearId = 3;
  if (!deps.isAlly(attacker) && deps.getActor(attacker).originId === bigBearId) {
    return deps.random.choice([true, false]);
  }

  // その他は 2%
  return deps.random.range(0, 1000) < 20;
}
