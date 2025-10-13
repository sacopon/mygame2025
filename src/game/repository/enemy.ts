import { Enemy, EnemyId } from "@game/domain";

const enemies: Enemy[] = [
  { enemyId: EnemyId(1), name: "スライム" },
  { enemyId: EnemyId(2), name: "スライムベス" },
  { enemyId: EnemyId(3), name: "ドラキー" },
  { enemyId: EnemyId(4), name: "まほうつかい" },
] as const;

// TODO: EnemyId が被ってないかを検証するメソッドを作成する(verifyEnemies)

export const findEnemy = (id: EnemyId): Enemy => {
  const enemy = enemies.find(a => a.enemyId === id);

  if (!enemy) {
    console.error(`Enemy not found: ${id}`);
  }

  return enemy!;
};
