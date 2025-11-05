import { Spell, SpellId } from "../..";

export interface SpellRepository {
  findSpell(id: SpellId): Spell;
}
