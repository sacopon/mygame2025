import { Action, ActionType, ActorId, TargetSide } from "@game/domain";

type CreateEnemyActionsParams = {
  enemyActorIds: ReadonlyArray<ActorId>;
  allyActorOrder: ReadonlyArray<ActorId>; // 先頭が“狙われやすい”とみなす
};

export function createEnemyActions(
  { enemyActorIds, allyActorOrder }: CreateEnemyActionsParams
): Action[] {
  const target = allyActorOrder[0]; // 先頭固定
  return enemyActorIds.map(enemyId => ({
    actorId: enemyId,
    actionType: ActionType.Attack,
    side: TargetSide.Them,
    selection: { kind: "none" },
    mode: {
      kind: "single",
      targetId: target,
    }
  }));
}
