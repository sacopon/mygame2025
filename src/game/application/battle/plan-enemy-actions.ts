import { Action, ActionType, ActorId } from "@game/domain";

export function createEnemyActions(enemyActorIds: ReadonlyArray<ActorId>): ReadonlyArray<Action> {
  return enemyActorIds.map(enemyId => ({
    actorId: enemyId,
    actionType: ActionType.Attack,
    selection: { kind: "none" },
    mode: {
      kind: "single",
    }
  }));
}
