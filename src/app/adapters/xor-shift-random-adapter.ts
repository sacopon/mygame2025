import { RandomPort } from "../../game/presentation/ports/random-port";
import { XorShiftRandom } from "@shared";

export class XorShiftRandomAdapter implements RandomPort {
  #random: XorShiftRandom;

  private constructor(random: XorShiftRandom) {
    this.#random = random;
  }

  /**
   * シードを指定して作成する
   */
  static create(seed = Date.now()): XorShiftRandomAdapter {
    return new XorShiftRandomAdapter(new XorShiftRandom(seed));
  }

  /**
   * 0〜0xFFFFFFFF の 32bit 符号なし整数を返す
   */
  next(): number {
    return this.#random.next();
  }

  /**
   * [min, max]の乱数を返す
   */
  range(min: number, max: number): number {
    let a = min | 0, b = max | 0;
    if (a > b) [a, b] = [b, a];

    // 幅（double で計算：0..2^53の精度あり）
    const spanNum = (b - a + 1);

    // a==b
    if (spanNum === 1) return a;

    // full 32bit 幅（0..0xFFFFFFFF）
    const MOD = 0x100000000; // 2^32

    if (spanNum >= MOD) {
      // ちょうど 2^32 幅なら拒否サンプリング不要。next() で均等。
      // （a=0, b=0xFFFFFFFF の典型ケース）
      return (a + this.next()) | 0; // a が 0 以外でもOK（32bit内）
    }

    // ここからは 1..(2^32-1) 幅 → 拒否サンプリングで無偏化
    const span = spanNum >>> 0; // 1..(2^32-1)
    const limit = MOD - (MOD % span);
    let r: number;

    do {
      r = this.next(); // 0..2^32-1
    } while (r >= limit);

    return a + (r % span);
  }

  /**
   * 0.0 <= x < 1.0 の浮動小数点乱数
   */
  float(): number {
    return this.next() / 0x100000000;
  }

  /**
   * 配列の中から1要素を選ぶ
   */
  choice<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error("choice: empty array");
    return arr[this.range(0, arr.length - 1)];
  }

  /**
   * 元の配列をシャッフルした新たな配列を作成する
   * フィッシャー–イェーツ（非破壊）
   */
  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.range(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * 乱数列の分岐を作成する
   */
  fork(): RandomPort {
    return new XorShiftRandomAdapter(this.#random.fork());
  }

  /**
   * 同じ状態から複製する
   */
  clone(): RandomPort {
    return new XorShiftRandomAdapter(this.#random.clone());
  }

  /**
   * 現在の乱数生成器を継続させるためのシードを取得(セーブ時に保存/復元することで乱数を引き継ぐ)
   */
  getState(): number {
    return this.#random.getState();
  }
}
