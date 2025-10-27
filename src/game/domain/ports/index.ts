import { AllyRepository, EncounterRepository, EnemyRepository } from "./repositories";

export * from "./repositories";

export type DomainPorts = {
  allyRepository: AllyRepository;
  enemyRepository: EnemyRepository;
  encounterRepository: EncounterRepository;
}
