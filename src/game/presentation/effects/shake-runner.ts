type ShakePattern = {
  dx: number;
  dy: number;
  durationMs: number;
}

export const DEFAULT_SHAKE_PATTERNS: ShakePattern[] = [
  { dx:-2, dy:-1, durationMs:25 },
  { dx:+2, dy:+1, durationMs:25 },
  { dx:-2, dy:-1, durationMs:35 },
  { dx:+2, dy:+1, durationMs:35 },
  { dx:-1, dy:+2, durationMs:35 },
  { dx:+1, dy:-2, durationMs:35 },
  { dx:-2, dy:+0, durationMs:40 },
  { dx:+2, dy:-0, durationMs:40 },
  { dx:-1, dy:-1, durationMs:40 },
  { dx:+1, dy:+1, durationMs:40 },
  { dx:-0, dy:+1, durationMs:45 },
  { dx:+2, dy:-1, durationMs:45 },
  { dx: 0, dy: 0, durationMs:60 },  // 収束
];

export class ShakeRunner {
  #patterns: ShakePattern[];
  // 現在適用されている patterns テーブル内のインデックス
  #index: number = 0;
  // index が次へ進むまでの残り時間(ms)
  #remainingMs: number = 0;
  // 揺れが実行中は false
  #done: boolean = false;

  constructor(patterns: ReadonlyArray<ShakePattern>) {
    this.#patterns = [...patterns];
    this.#setToDone();
  }

  get isActive(): boolean {
    return !this.#done;
  }

  getCurrentOffset(): { dx: number, dy: number } {
    return {
      dx: this.#patterns[this.#index].dx,
      dy: this.#patterns[this.#index].dy,
    };
  }

  getTotalDurationMs(): number {
    return this.#patterns.reduce((prev, curr) => prev + curr.durationMs, 0);
  }

  start(): void {
    this.#done = false;
    this.#index = 0;
    this.#remainingMs = this.#patterns[0]?.durationMs ?? 0;
  }

  update(deltaMs: number): void {
    if (this.#done) { return; }

    this.#remainingMs -= deltaMs;

    if (this.#remainingMs <= 0) {
      ++this.#index;

      if (this.#patterns.length <= this.#index) {
        this.#setToDone();
        return;
      }

      this.#setDuration();
    }
  }

  #setDuration(): void {
    this.#remainingMs = this.#patterns[this.#index].durationMs;
  }

  #setToDone(): void {
    this.#done = true;
    this.#remainingMs = 0;
    this.#index = Math.max(0, this.#patterns.length - 1);  // 最終位置で固定しておく
  }
}
