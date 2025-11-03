import { ActorId, BattleDomainState, PlannedAction, TurnAgility } from "@game/domain";
import { TurnSnapshot } from "@game/domain/models/turn-snapshot";
import { RandomPort } from "@game/presentation";

/**
 * このターンでの素早さの確定、防御状態の適用
 */
export function buildTurnSnapshot(
  state: Readonly<BattleDomainState>,
  actions: ReadonlyArray<PlannedAction>,
  deps: { random: RandomPort }
): TurnSnapshot {
  // このターンの素早さを決める
  const agilityByActorId = new Map<ActorId, TurnAgility>();

  for (const actorState of state.getActorStates()) {
    const base = actorState.currentAgility;
    const r = deps.random.float();  // 0.0 <= r < 1.0
    const factor = 0.5 + r * 0.5; // 0.5〜1.0
    const rolled = base.value * factor;
    agilityByActorId.set(actorState.actorId, TurnAgility.of(rolled));
  }

  // 防御状態を反映する
  const defendingActorIds = new Set<ActorId>();

  for (const action of actions) {
    if (action.actionType === "SelfDefence") {
      defendingActorIds.add(action.actorId);
    }
  }

  return {
    agilityByActorId,
    defendingActorIds,
  };
}
