/**
 * 各種 UI からの入力情報を受け取り、ゲーム内から使用できる形で保持する
 */
export class InputState
{
  #keyState: number = 0;
  #touchState: number = 0;
  #previousComposedState: number = 0;

  constructor() {
  }

  /**
   * キーボード入力によって指定のボタンを表すビットを操作する
   *
   * @param bit ビット番号
   * @param down 押下状態の場合は true、離した場合は false
   */
  setKey(bit: number, down: boolean) {
    this.#keyState = down ? (this.#keyState | (1 << bit)) : (this.#keyState & ~(1 << bit));
  }

  /**
   * タッチ入力によって指定のボタンを表すビットを操作する
   *
   * @param bit ビット番号
   * @param down 押下状態の場合は true、離した場合は false
   */
  setTouch(bit: number, down: boolean) {
    this.#touchState = down ? (this.#touchState | (1 << bit)) : (this.#touchState & ~(1 << bit));
  }

  /**
   * タッチによる入力状態をクリアする
   */
  clearTouchDir() {
    this.#touchState &= ~0b1111;
  }

  /**
   * 各入力をまとめた現在の状態を取得する
   *
   * @returns 入力情報(ビットの定義は PAD_BIT を使用する)
   */
  composed() {
    return this.#keyState | this.#touchState;
  }

  /**
   * 1フレーム前の入力状態を取得する
   *
   * @returns 1フレーム前の入力情報(ビットの定義は PAD_BIT を使用する)
   */
  previousComposed() {
    return this.#previousComposedState;
  }

  /**
   * 前フレームの情報を退避して次のフレームへの準備を行う
   */
  next() {
    this.#previousComposedState = this.composed();
  }
};
