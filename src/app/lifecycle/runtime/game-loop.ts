import { Ticker } from "pixi.js";
import { RuntimeContext } from "../runtime";

export function startGameLoop(rc: RuntimeContext, unbindKeyboard: () => void): void {
  const tick = (ticker: Ticker) => {
    if (rc.padUI) {
      rc.padUI.updateButtonImages();
    }

    // ゲーム側の更新処理
    rc.gameRoot.update(ticker.deltaMS);

    // キー入力を次のフレームに備える
    rc.inputState.next();
  };

  rc.app.ticker.add(tick);

  // abort 時の終了処理
  rc.abortController.signal.addEventListener("abort", () => {
    rc.app.ticker.remove(tick);
    rc.gameRoot.dispose();
    unbindKeyboard();
  });

  // ページ離脱時に abort
  window.addEventListener("pagehide", () => rc.abortController.abort(), { once: true });
}
