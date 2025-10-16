import { AllyRepository } from "./repositories/ally-repository";
import { EnemyRepository } from "./repositories/enemy-repository";

export * from "./repositories";

export type DomainPorts = {
  allyRepository: AllyRepository;
  enemyRepository: EnemyRepository;
}
