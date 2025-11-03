/**
 * 値オブジェクト
 */
export abstract class ValueObject {
  readonly #value: number;

  protected constructor(value: number, min: number = 0, max: number = Number.MAX_VALUE) {
    this.#value = Math.min(max, Math.max(min, value));
  }

  protected static makeOf<T extends ValueObject>(ctor: (value: number) => T) {
    return function of(value: number | T): T {
      const v = typeof value === "number" ? value : value.value;

      // protected のコンストラクタが使えるように、ctor を一旦 any にキャストして使う
      return ctor(v) as T;
    };
  }

  get value(): number {
    return this.#value;
  }

  equals(other: ValueObject): boolean {
    return this.constructor === other.constructor && this.value === other.value;
  }

  clone(): this {
    // 派生クラスのコンストラクトをするので any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.constructor as any).of(this.value);
  }
}
