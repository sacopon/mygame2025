import { Enemy, EnemyId } from "@game/domain";

export interface EnemyRepository {
  findEnemy(id: EnemyId): Enemy;
}
