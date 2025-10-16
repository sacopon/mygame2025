import { EnemyRepository } from "../../domain/ports/repositories/enemy-repository";
import { Enemy, EnemyId } from "@game/domain";

// TODO: EnemyId が被ってないかを検証するメソッドを作成する(verifyEnemies)
export class EnemyRepositoryInMemory implements EnemyRepository {
  #data: ReadonlyArray<Enemy>;

  constructor(data: ReadonlyArray<Enemy>) {
    this.#data = data;
  }

  findEnemy(id: EnemyId): Enemy {
    const enemy = this.#data.find(a => a.enemyId === id);

    if (!enemy) {
      console.error(`Enemy not found: ${id}`);
    }

    return enemy!;
  }
}
