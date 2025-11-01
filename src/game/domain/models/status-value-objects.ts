/**
 * レベル
 * (本来経験値から計算で導き出されるものかもしれない)
 */
export class Level {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  static of(value: number | Readonly<Level>): Readonly<Level> {
    if (typeof value === "number") {
      return new Level(value);
    }

    return new Level(value.value);
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

  static of(value: number | Readonly<Hp>): Readonly<Hp> {
    if (typeof value === "number") {
      return new Hp(value);
    }

    return new Hp(value.value);
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

  static of(value: number | Damage): Damage {
    if (typeof value === "number") {
      return new Damage(value);
    }

    return new Damage(value.#value);
  }

  get value(): number {
    return this.#value;
  }
}

/**
 * 攻撃力
 */
export class Attack {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  static of(value: number | Readonly<Attack>): Readonly<Attack> {
    if (typeof value === "number") {
      return new Attack(value);
    }

    return new Attack(value.value);
  }

  get value(): number {
    return this.#value;
  }
}

/**
 * 攻撃力
 */
export class Defence {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  static of(value: number | Readonly<Defence>): Readonly<Defence> {
    if (typeof value === "number") {
      return new Defence(value);
    }

    return new Defence(value.value);
  }

  get value(): number {
    return this.#value;
  }
}
