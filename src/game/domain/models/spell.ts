import { Brand } from "@shared";
import { ValueObject } from "./value-object";

export type SpellId = Brand<number, "SpellId">;
export const SpellId = (n: number) => n as SpellId;

export type SpellTarget = {
  scope: "single" | "group" | "all";
  side: "us" | "them";
};

export type SpellEffectType = "damage" | "heal";

export class SpellPower extends ValueObject {
  protected constructor(value: number) {
    super(value, 0);
  }

  static of = ValueObject.makeOf<SpellPower>(value => new SpellPower(value));
}

export class SpellCost extends ValueObject {
  static readonly MAX = 99;

  protected constructor(value: number) {
    super(value, 0, SpellCost.MAX);
  }

  static of = ValueObject.makeOf<SpellCost>(value => new SpellCost(value));
}

export type Spell = Readonly<{
  spellId: SpellId;
  name: string;
  cost: SpellCost,
  description: string,
  power: SpellPower;
  target: SpellTarget;
  type: SpellEffectType;
}>;
