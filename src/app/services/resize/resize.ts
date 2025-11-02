import { UIMode, VirtualPadUI, VirtualPadUIForBare } from "@app/features";
import { onResize, RuntimeContext } from "../..";

export type ViewState = {
  mode: UIMode,
  padUI: VirtualPadUI | null;
  bareUI: VirtualPadUIForBare;
}

/**
 * 画面のサイズを取得する.
 * 可能なら visualViewport を優先
 * @returns
 */
function readViewportSize() {
  const vv = window.visualViewport;
  const w = Math.max(1, Math.round(vv ? vv.width  : window.innerWidth));
  const h = Math.max(1, Math.round(vv ? vv.height : window.innerHeight));

  return { w, h };
}

/**
 * リサイズを要求するイベントが一度に複数発火した際に
 * RequestAnimationFrame を活用して1フレームに1回までの処理にまとめるためのヘルパー
 */
export function createResizeHandler(rc: RuntimeContext) {
  let scheduled = false;
  let lastW = 0, lastH = 0;

  return () => {
    if (scheduled) {
      return;
    }

    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      const { w, h } = readViewportSize();

      if (w === lastW && h === lastH) {
        return;
      }

      lastW = w;
      lastH = h;
      onResize(rc, w, h, false);
    });
  };
}
