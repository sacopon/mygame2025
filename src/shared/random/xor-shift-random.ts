/**
 * XorShiftを使用した乱数
 */
export class XorShiftRandom {
  #state: number = 0;

  constructor(seed: number) {
    this.#state = (seed >>> 0) || 0x6d2b79f5;
  }

  next(): number {
    let x = this.#state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.#state = x >>> 0;
    return this.#state;
  }

  /**
   * この乱数の続きとして乱数生成器を作成したい場合のシード用の値を取得する
   * この値をセーブしておけば、ロード時に続きの乱数からはじめられる
   * (リセットで吟味する対策に)
   */
  getState(): number {
    return this.#state;
  }

  /**
   * 元の乱数から繋がる別の系統を作成する
   * 種類別で乱数を分けるなどしたい場合
   */
  fork(): XorShiftRandom {
    return new XorShiftRandom(this.next());
  }

  /**
   * 同じ乱数が欲しい場合に別の乱数生成器を作成する
   */
  clone(): XorShiftRandom {
    return new XorShiftRandom(this.getState());
  }
}
