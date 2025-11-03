import { ValueObject } from "./value-object";

/**
 * ターンの最初に決定される「このターンでの素早さ」
 * 行動順や回避率に影響
 */
export class TurnAgility extends ValueObject {
  protected constructor(value: number) {
    super(value, 0);
  }

  static of = ValueObject.makeOf<TurnAgility>(value => new TurnAgility(value));
}
