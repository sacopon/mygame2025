import { ValueObject } from "./value-object";

/**
 * ダメージ
 */
export class Damage extends ValueObject {
  static readonly MIN = 0;
  static readonly MAX = 9999;

  protected constructor(value: number) {
    super(Math.floor(value), Damage.MIN, Damage.MAX);
  }

  static of = ValueObject.makeOf<Damage>(value => new Damage(value));
}
