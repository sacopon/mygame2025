/**
 * キャラクターのパラメータ共通基底クラス
 */
abstract class CharacterParameter {
  readonly #value: number;

  protected constructor(value: number, max: number) {
    this.#value = Math.min(Math.max(0, value), max);
  }

  protected static makeOf<T extends CharacterParameter>(ctor: (value: number) => T) {
    return function of(value: number | T): T {
      const v = typeof value === "number" ? value : value.value;

      // protected のコンストラクタが使えるように、ctor を一旦 any にキャストして使う
      return ctor(v) as T;
    };
  }

  get value(): number {
    return this.#value;
  }
}

/**
 * ヒットポイント
 */
export class Hp extends CharacterParameter {
  static readonly MAX = 999;

  protected constructor(value: number) {
    super(value, Hp.MAX);
  }

  get isAlive(): boolean {
    return 0 < this.value;
  }

  get isDead(): boolean {
    return !this.isAlive;
  }

  takeDamage(damage: Damage): Hp {
    return Hp.of(Math.max(0, this.value - damage.value));
  }

  static of = CharacterParameter.makeOf<Hp>(value => new Hp(value));
}

/**
 * レベル
 * (本来経験値から計算で導き出されるものかもしれない)
 */
export class Level extends CharacterParameter {
  static readonly MAX = 99;

  protected constructor(value: number) {
    super(value, Level.MAX);
  }

  static of = CharacterParameter.makeOf<Level>(value => new Level(value));
}

/**
 * ダメージ
 */
export class Damage extends CharacterParameter {
  static readonly MAX = 9999;

  protected constructor(value: number) {
    super(value, Damage.MAX);
  }

  static of = CharacterParameter.makeOf<Damage>(value => new Damage(value));
}

/**
 * 攻撃力
 */
export class Attack extends CharacterParameter {
  static readonly MAX = 999;

  protected constructor(value: number) {
    super(value, Attack.MAX);
  }

  static of = CharacterParameter.makeOf<Attack>(value => new Attack(value));
}

/**
 * 防御力
 */
export class Defence extends CharacterParameter {
  static readonly MAX = 999;

  protected constructor(value: number) {
    super(value, Defence.MAX);
  }

  static of = CharacterParameter.makeOf<Defence>(value => new Defence(value));
}

/**
 * 素早さ
 */
export class Agility extends CharacterParameter {
  static readonly MAX = 999;

  protected constructor(value: number) {
    super(value, Agility.MAX);
  }

  static of = CharacterParameter.makeOf<Agility>(value => new Agility(value));
}
