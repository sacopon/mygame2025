import { SpellRepository } from "../../domain/ports/repositories/spell-repository";
import { Spell, SpellId } from "@game/domain";

export class SpellRepositoryInMemory implements SpellRepository {
  #data: ReadonlyArray<Spell>;

  constructor(data: ReadonlyArray<Spell>) {
    this.#data = data;
  }

  findSpell(id: SpellId): Spell {
    const spell = this.#data.find(a => a.spellId === id);

    if (!spell) {
      console.error(`spell not found: ${id}`);
    }

    return spell!;
  }
};
