import { assertNever } from "@shared/utils";

/**
 * 各状態(ステート)のインターフェース
 */
export interface StackState<Context> {
  onEnter(context: Context): void;
  onLeave(context: Context): void;
  onSuspend(): void;
  onResume(): void;
  update(deltaTime: number): void;
}

type Operation<Context> =
  | { kind: "push", state: StackState<Context> }
  | { kind: "pop" }
  | { kind: "replace", state: StackState<Context> }
  | { kind: "rewind", depth: number };

/**
 * ゲーム中の状態(ステート)をスタック的に管理する部分の共通クラス
 */
export class StateStack<Context> {
  #context: Context;
  #stack: StackState<Context>[] = [];
  // スタック操作の予約分
  #scheduledOperations: Operation<Context>[] = [];
  // 予約されたスタック操作の実行中にさらにスタックへの操作がリクエストされた分についてはこちらに入る
  #pendingOperations: Operation<Context>[] = [];
  // 予約されたスタック操作の実行中
  #isFlushing = false;

  constructor(context: Context) {
    this.#context = context;
  }

  /**
   * 状態をプッシュする(直ちに反映)
   *
   * @param state プッシュする状態
   */
  push(state: StackState<Context>): void {
    const top = this.#stack.at(-1);

    if (top) {
      top.onSuspend();
    }

    this.#stack.push(state);
    state.onEnter(this.#context);
  }

  /**
   * 状態をポップする(直ちに反映)
   *
   * @param state プッシュする状態
   */
  pop(): void {
    const top = this.#stack.pop();

    if (!top) {
      return;
    }

    top.onLeave(this.#context);
    const next = this.#stack.at(-1);

    if (next) {
      next.onResume();
    }
  }

  /**
   * 先頭の状態を置き換える(直ちに反映)
   *
   * @param state 新たに遷移する状態
   */
  replaceTop(state: StackState<Context>): void {
    const top = this.#stack.pop();

    if (top) {
      top.onLeave(this.#context);
    }

    this.#stack.push(state);
    state.onEnter(this.#context);
  }

  /**
   * 現在のスタックの深さのマーカーを返す
   *
   * @return マーカー
   */
  mark(): number {
    return this.#stack.length;
  }

  /**
   * 指定の深さまで巻き戻す
   *
   * @param depth mark() で取得した値
   */
  rewindTo(depth: number): void {
    const target = Math.max(0, Math.min(depth, this.#stack.length));

    // まとめてスタックから外す
    while (this.#stack.length > target) {
      const s = this.#stack.pop()!;
      s.onLeave(this.#context);
    }

    const top = this.#stack.at(-1);

    if (top) {
      top.onResume();
    }
  }

  /**
   * 現在の先頭のステートを取得
   *
   * @return 先頭のステート
   */
  top(): StackState<Context> | null {
    const top = this.#stack.at(-1);
    return top ? top : null;
  }

  /**
   * スタックが空ではないかどうか
   *
   * @return 空ではない場合は true
   */
  hasAny(): boolean {
    return 0 < this.#stack.length;
  }

  // 以下予約して反映する系のメソッド
  requestPush(state: StackState<Context>): void {
    this.#enqueue({ kind: "push", state });
  }

  requestPop(): void {
    this.#enqueue({ kind: "pop" });
  }

  requestReplaceTop(state: StackState<Context>): void {
    this.#enqueue({ kind: "replace", state });
  }

  requestRewindTo(depth: number): void {
    this.#enqueue({ kind: "rewind", depth });
  }

  /**
   * フレーム更新処理
   */
  update(deltaTime: number): void {
    this.top()?.update(deltaTime);

    if (0 < this.#scheduledOperations.length) {
      this.#isFlushing = true;
      const operations = this.#scheduledOperations;
      this.#scheduledOperations = [];

      for (let op of operations) {
        switch (op.kind) {
          case "push":    this.push(op.state);       break;
          case "pop":     this.pop();                break;
          case "replace": this.replaceTop(op.state); break;
          case "rewind":  this.rewindTo(op.depth);   break;
          default:        assertNever(op);
        }
      }

      this.#isFlushing = false;
    }

    // フラッシュ中に追加された分を反映する
    if (0 < this.#pendingOperations.length) {
      this.#scheduledOperations = [...this.#pendingOperations];
      this.#pendingOperations.length = 0;
    }
  }

  #enqueue(operation: Operation<Context>): void {
    // 予約されたスタック操作の実行中に発行されたリクエストは pending の方に入る
    if (this.#isFlushing) {
      this.#pendingOperations.push(operation);
      return;
    }

    this.#scheduledOperations.push(operation);
  }
}
