export class BlinkController {
  /** 点滅間隔(1回の点滅ON/OFFサイクルの長さ) */
  readonly #blinkIntervalMs: number;
  /** 点滅演出全体の合計時間(ms) */
  #blinkDurationMs: number = 0;
  /** 点滅中フラグ */
  #blinking = false;
  /** 表示/非表示フラグ */
  #visible = true;
  /** 点滅演出の経過時間(ms) */
  #blinkElapsedMs = 0;
  /** ON/OFF 切り替えのためのカウンタ */
  #blinkTickMs = 0;

  constructor(intervalMs = 100) {
    this.#blinkIntervalMs = intervalMs;
  }

  get isBlinking(): boolean {
    return this.#blinking;
  }

  get visible(): boolean {
    return this.#visible;
  }

  start(durationMs: number): void {
    this.#blinking = true;
    this.#blinkDurationMs = Math.max(0, durationMs);
    this.#blinkElapsedMs = 0;
    this.#blinkTickMs = 0;
    this.#visible = false; // 開始時は不可視状態
  }

  update(deltaMs: number) {
    if (!this.isBlinking) {
      return;
    }

    this.#blinkElapsedMs += deltaMs;
    this.#blinkTickMs += deltaMs;

    if (this.#blinkIntervalMs <= this.#blinkTickMs) {
      this.#blinkTickMs = 0;
      this.#visible = !this.#visible;
    }

    if (this.#blinkDurationMs <= this.#blinkElapsedMs) {
      // 演出時間が経過. 可視状態に戻して終了
      this.#visible = true;
      this.#blinking = false;
    }
  }
}
