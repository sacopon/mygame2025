import { AllyRepository, EncounterRepository, EnemyRepository, SpellRepository } from "./repositories";

export * from "./repositories";

export type DomainPorts = {
  allyRepository: AllyRepository;
  enemyRepository: EnemyRepository;
  spellRepository: SpellRepository;
  encounterRepository: EncounterRepository;
}
