export interface RandomPort {
  /** 0〜0xFFFFFFFF の 32bit 符号なし整数を返す */
  next(): number;
  /** [min, max]の乱数を返す */
  range(min: number, max: number): number;
  /** 0.0 <= x < 1.0 の浮動小数点乱数 */
  float(): number;
  /** 配列の中から1要素を選ぶ */
  choice<T>(arr: readonly T[]): T;
  /** 元の配列をシャッフルした新たな配列を作成する */
  shuffle<T>(arr: readonly T[]): T[];
  /** 乱数列の分岐を作成する */
  fork(): RandomPort;
  /** 同じ状態から複製する */
  clone(): RandomPort;
  /** 現在の乱数生成器を継続させるためのシードを取得(セーブ時に保存/復元することで乱数を引き継ぐ) */
  getState(): number;
}
