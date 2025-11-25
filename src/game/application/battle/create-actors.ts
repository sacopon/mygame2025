import { Actor, ActorId, AllyActor, AllyId, createAllyActor, createEnemyActor, DomainPorts, EnemyActor, EnemyGroupId, EnemyId } from "@game/domain";

/**
 * 数値 → 全角アルファベットへの変換
 * 全角A～Z（FF21–FF3A）: 0→"Ａ", 1→"Ｂ", ...
 */
function fullWidthAlpha(n: number): string {
  const A = "Ａ".charCodeAt(0); // 0xFF21
  const Z = "Ｚ".charCodeAt(0); // 0xFF3A
  const span = Z - A + 1;       // 26
  // 26個を超えたら "ＡＡ" などにしたい場合はここを拡張
  const idx = n % span;
  return String.fromCharCode(A + idx);
}

/**
 * 先頭に参加する味方、敵の情報から、Actor としてのインスタンスを生成する
 * ActorId は味方全員→敵全員の順に割り振られる
 * 同一の敵が複数含まれる場合、個体ごとに末尾にアルファベットを付加した名前で生成する
 */
export function createActors(allyIds: AllyId[], enemyIds: EnemyId[], domain: DomainPorts): ReadonlyArray<Actor> {
  const allyActors: AllyActor[] = allyIds.map((allyId, index) => createAllyActor(domain.allyRepository.findAlly(allyId), ActorId(index + 1)));

  // 種別ごとの総数
  const counts = new Map<EnemyId, number>();
  enemyIds.forEach(enemyId => counts.set(enemyId, (counts.get(enemyId) ?? 0) + 1));

  // 種別ごとの生成済み数
  const createdCounts = new Map<EnemyId, number>();
  counts.forEach((_value, key) => createdCounts.set(key, 0));

  let prevId: EnemyId | null = null;
  let nextGroupNum = 0; // 隣接した同一種別は同一グループとなる

  const enemyActors: EnemyActor[] = enemyIds
    .map((enemyId, index) => {
      if (prevId !== enemyId) { ++nextGroupNum; }
      prevId = enemyId;

      const enemy = domain.enemyRepository.findEnemy(enemyId);
      const total = counts.get(enemyId) ?? 0;
      // 名前作成(同じ敵が複数いる場合は末尾にA〜のアルファベットを付ける)
      const created = createdCounts.get(enemyId) ?? 0;
      const name = total <= 1 ? enemy.name : `${enemy.name}${fullWidthAlpha(created)}`;

      // 同一の敵の生成数インクリメント
      createdCounts.set(enemyId, created + 1);

      return createEnemyActor(
        { ...enemy, name },
        ActorId(1 + allyActors.length + index),
        EnemyGroupId(nextGroupNum));
    });

  return [...allyActors, ...enemyActors];
}

