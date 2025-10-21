import { planTurnOrder } from "@game/application/battle/plan-turn-order";
import { ActorId, EnemyGroupId } from "@game/domain";
import type { Action } from "@game/domain/models/action";

// 最低限のモック型
const A = (id: number): Action => ({
  actorId: id as ActorId,
  actionType: "Attack",
  selection: { kind: "group", groupId: EnemyGroupId(id) },
});

// test/fakes/fake-random.ts
import type { RandomPort } from "@game/presentation/ports/random-port";

export class FakeRandom implements RandomPort {
  next(): number { return 0; }
  range(min: number, _max: number): number { return min; }
  float(): number { return 0; }
  choice<T>(arr: readonly T[]): T { return arr[0]; }
  shuffle<T>(arr: readonly T[]): T[] { return arr.slice().reverse(); } // ←決め打ち
  fork(): RandomPort { return this; }
  clone(): RandomPort { return this; }
  getState(): number { return 0; }
}

describe("planTurnOrder", () => {
  test("ActorId の降順で並ぶ", () => {
    const actions = [A(2), A(5), A(3)];
    const result = planTurnOrder(actions, new FakeRandom());
    expect(result.map(a => a.actorId)).toEqual([5, 3, 2]);
  });

  test("元配列を破壊しない（イミュータブル）", () => {
    const actions = [A(1), A(2)];
    const snapshot = [...actions];
    planTurnOrder(actions, new FakeRandom());
    expect(actions).toEqual(snapshot);
  });

  test("空配列でも落ちない", () => {
    expect(planTurnOrder([], new FakeRandom())).toEqual([]);
  });
});
