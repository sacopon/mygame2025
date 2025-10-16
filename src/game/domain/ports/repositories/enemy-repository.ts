import { Enemy, EnemyId } from "../../actor";

export interface EnemyRepository {
  findEnemy(id: EnemyId): Enemy;
}
