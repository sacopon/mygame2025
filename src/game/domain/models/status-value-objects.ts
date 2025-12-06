import { CharacterParameter } from "./character-parameter";
import { Damage } from "./damage";
import { HealAmount } from "./heal-amount";

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

  heal(healAmount: HealAmount, maxHp: Hp): Hp {
    return Hp.of(Math.min(maxHp.value, this.value + healAmount.value));
  }

  static of = CharacterParameter.makeOf<Hp>(value => new Hp(value));
}

/**
 * マジックパワー
 */
export class Mp extends CharacterParameter {
  static readonly MAX = 999;

  protected constructor(value: number) {
    super(value, Mp.MAX);
  }

  static of = CharacterParameter.makeOf<Mp>(value => new Mp(value));
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
  static readonly MAX = 99;

  protected constructor(value: number) {
    super(value, Agility.MAX);
  }

  static of = CharacterParameter.makeOf<Agility>(value => new Agility(value));
}
