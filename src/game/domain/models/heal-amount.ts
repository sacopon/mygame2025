import { ValueObject } from "./value-object";

/**
 * 回復量
 */
export class HealAmount extends ValueObject {
  static readonly MIN = 0;
  static readonly MAX = 9999;

  protected constructor(value: number) {
    super(Math.floor(value), HealAmount.MIN, HealAmount.MAX);
  }

  static of = ValueObject.makeOf<HealAmount>(value => new HealAmount(value));
}
