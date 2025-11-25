import { ResolveDeps } from "@game/application/battle/resolve-types";
import { ActorId, Agility, AllyActor, AllyId, Attack, BattleDomainState, Defence, EnemyActor, EnemyGroupId, EnemyId, Hp, Level } from "@game/domain";

// 型短縮用
export const aid = (n: number) => n as ActorId;
export const gid = (n: number) => n as EnemyGroupId;

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
export function createStateAndDeps(opts: {
  allies: { id: number; groupId?: number, hp?: number }[];
  enemies: { id: number; groupId: number, hp?: number }[];
}) {
  const allies: AllyActor[] = opts.allies.map(a => ({
    actorId: aid(a.id),
    originId: AllyId(a.id),
    actorType: "Ally",
    name: `Ally${a.id}`,
    level: Level.of(1),
    spellIds: [],
    hp: Hp.of(a.hp ?? 10),
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
    hp: Hp.of(e.hp ?? 10),
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    random: dummyRandom as any,
    getActor: _id => {
      // resolveTargets では使わないので適当でも OK
      throw new Error("not used in this test");
    },
    getSpell: _id => {
      throw new Error("not used in this test");
    },
    isAlly: (id: ActorId) => allyIds.has(id),
    getActorIdsByEnemyGroup: (groupId: EnemyGroupId) =>
      groupMap.get(groupId) ?? [],
    enemyGroupIds: Array.from(groupMap.keys()),
  };

  return { state, deps, allies, enemies };
}
