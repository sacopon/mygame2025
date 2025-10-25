/**
 * レベル
 * (本来経験値から計算で導き出されるものかもしれない)
 */
export class Level {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  static of(value: number): Level {
    return new Level(value);
  }

  get value(): number {
    return this.#value;
  }
}

/**
 * ヒットポイント
 */
export class Hp {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  static of(value: number): Hp {
    return new Hp(value);
  }

  get value(): number {
    return this.#value;
  }

  get isAlive(): boolean {
    return 0 < this.#value;
  }

  get isDead(): boolean {
    return !this.isAlive;
  }

  takeDamage(damage: Damage): Hp {
    return new Hp(Math.max(0, this.#value - damage.value));
  }
}

/**
 * ダメージ
 */
export class Damage {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  static of(value: number): Damage {
    return new Damage(value);
  }

  get value(): number {
    return this.#value;
  }
}
