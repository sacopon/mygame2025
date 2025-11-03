import { ValueObject } from "./value-object";

/**
 * キャラクターのパラメータ共通基底クラス
 */
export abstract class CharacterParameter extends ValueObject {
  protected constructor(value: number, max: number) {
    super(Math.floor(Math.min(max, Math.max(0, value))));
  }
}
