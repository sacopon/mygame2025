import { resolveAttackTargets } from "@game/application/battle/resolve-common";
import { ResolveDeps } from "@game/application/battle/resolve-types";
import {
  BattleDomainState,
  ActorId,
  AllyActor,
  EnemyActor,
  EnemyGroupId,
  AttackPlannedAction,
  ActionType,
  Level,
  Hp,
  Attack,
  Defence,
  Agility,
  AllyId,
  EnemyId,
} from "@game/domain";

// 型短縮用
const aid = (n: number) => n as ActorId;
const gid = (n: number) => n as EnemyGroupId;

// テスト用の単純な RandomPort
const dummyRandom = {
  // 先頭を返すだけにして deterministic に
  choice<T>(arr: T[]): T {
    if (arr.length === 0) throw new Error("choice: empty array");
    return arr[0];
  },
  shuffle<T>(arr: T[]): T[] {
    return [...arr];
  },
  range(min: number, _max: number): number {
    return min;
  },
  float(): number {
    return 0.0;
  },
};

// シンプルな state + deps をまとめて作るヘルパ
function createStateAndDeps(opts: {
  allies: { id: number; groupId?: number }[];
  enemies: { id: number; groupId: number }[];
}) {
  const allies: AllyActor[] = opts.allies.map(a => ({
    actorId: aid(a.id),
    originId: AllyId(a.id),
    actorType: "Ally",
    name: `Ally${a.id}`,
    level: Level.of(1),
    hp: Hp.of(10),
    maxHp: Hp.of(10),
    attack: Attack.of(5),
    defence: Defence.of(3),
    agility: Agility.of(4),
  }));

  const enemies: EnemyActor[] = opts.enemies.map(e => ({
    actorId: aid(e.id),
    originId: EnemyId(e.id),
    actorType: "Enemy",
    enemyGroupId: gid(e.groupId),
    name: `Enemy${e.id}`,
    hp: Hp.of(10),
    maxHp: Hp.of(10),
    attack: Attack.of(5),
    defence: Defence.of(3),
    agility: Agility.of(4),
  }));

  const state = BattleDomainState.fromActors(allies, enemies);

  // groupId -> actorIds のマップを作っておく
  const groupMap = new Map<EnemyGroupId, ActorId[]>();
  for (const enemy of enemies) {
    const g = enemy.enemyGroupId;
    const arr = groupMap.get(g) ?? [];
    arr.push(enemy.actorId);
    groupMap.set(g, arr);
  }

  const allyIds = new Set(state.getAllyActorStates().map(a => a.actorId));

  const deps: ResolveDeps = {
    random: dummyRandom as any,
    getActor: _id => {
      // resolveTargets では使わないので適当でも OK
      throw new Error("not used in this test");
    },
    getSpell: _id => {
      throw new Error("not used in this test");
    },
    isAlly: (id: ActorId) => allyIds.has(id),
    aliveAllAllies: () => state.getAliveAllyActorIds(),
    aliveAllEnemies: () => state.getAliveEnemyActorIds(),
    getActorIdsByEnemyGroup: (groupId: EnemyGroupId) =>
      groupMap.get(groupId) ?? [],
    aliveAllActors: () => [
      ...state.getAliveAllyActorIds(),
      ...state.getAliveEnemyActorIds(),
    ],
    enemyGroupIds: Array.from(groupMap.keys()),
  };

  return { state, deps, allies, enemies };
}

describe("resolveAttackTargets (ally single attack → enemy group)", () => {
  test("明示的 targetId が生存していればそれを返す", () => {
    const { state, deps, allies, enemies } = createStateAndDeps({
      allies: [{ id: 1 }],
      enemies: [
        { id: 10, groupId: 1 },
        { id: 11, groupId: 1 },
      ],
    });

    const attacker = allies[0];
    const target = enemies[0];

    const action: AttackPlannedAction = {
      actionType: ActionType.Attack,
      actorId: attacker.actorId,
      // UI でグループ1を選択した想定
      selection: { kind: "group", groupId: target.enemyGroupId },
      // 計画フェーズで targetId まで指定されている場合を想定
      mode: { kind: "single", targetId: target.actorId },
    };

    const result = resolveAttackTargets(state, action, deps);
    expect(result).toEqual([target.actorId]);
  });
});
