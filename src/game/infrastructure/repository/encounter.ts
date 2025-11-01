import { EncounterEntry, EncounterTable, EnemyId } from "@game/domain";
import { EncounterRepository } from "../../domain/ports/repositories/encounter-repository";

const encountTable: EncounterEntry[] = [
  // [EnemyId(1), EnemyId(1), EnemyId(1), EnemyId(1), EnemyId(1)],
  [EnemyId(3), EnemyId(3)],
  // [EnemyId(1), EnemyId(1), EnemyId(2), EnemyId(2), EnemyId(1)],
  // [EnemyId(1), EnemyId(1), EnemyId(2), EnemyId(2), EnemyId(3), EnemyId(4)],
];

export class EncounterRepositoryInMemory implements EncounterRepository {
  constructor() {
  }

  /**
   * (現在はパラメータなしだが、レベルやエリアなど、なんらかの情報を渡して対象のエンカウントテーブルを取得する
   */
  getEncounterTable(): EncounterTable {
    return encountTable;
  }
}
