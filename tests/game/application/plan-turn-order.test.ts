import { planTurnOrder } from "@game/application/battle/plan-turn-order";
import { ActorId } from "@game/domain";
import type { Action } from "@game/domain/models/action";

// 最低限のモック型
const A = (id: number): Action => ({
  actorId: id as ActorId,
  actionType: "Attack",
  // side: "Them",
  selection: { kind: "group", groupId: id as any },
});

describe("planTurnOrder", () => {
  test("ActorId の降順で並ぶ", () => {
    const actions = [A(2), A(5), A(3)];
    const result = planTurnOrder(actions);
    expect(result.map(a => a.actorId)).toEqual([5, 3, 2]);
  });

  test("元配列を破壊しない（イミュータブル）", () => {
    const actions = [A(1), A(2)];
    const snapshot = [...actions];
    planTurnOrder(actions);
    expect(actions).toEqual(snapshot);
  });

  test("空配列でも落ちない", () => {
    expect(planTurnOrder([])).toEqual([]);
  });
});
