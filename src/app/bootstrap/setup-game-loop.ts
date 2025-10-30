import { Ticker } from "pixi.js";
import { PAD_BIT } from "@shared";
import { RuntimeContext } from "./runtime-context";
import { toggleMode } from "./setup-ui-and-resize";

export function setUpGameLoop(rc: RuntimeContext, unbindKeyboard: () => void): void {
  // 毎フレーム呼ばれる処理を追加
  const tick = (ticker: Ticker) => {
    if (rc.padUI) {
      rc.padUI.updateButtonImages();
    }

    if ((rc.inputState.composed() & ~rc.inputState.previousComposed()) & (1 << PAD_BIT.BUTTON3)) {
      toggleMode(rc);
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

  // 終了時に abort を呼び出す設定
  window.addEventListener("pagehide", () => rc.abortController.abort(), { once: true });
}
