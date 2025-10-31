import { Application } from "pixi.js";
import { GameScreenSpec } from "..";
import { AppLayers } from "@app/config";
import { SkinResolver, UIMode, VirtualPadUI, VirtualPadUIForBare } from "@app/features";
import { onResize } from "../..";

export type ResizeOptions = {
  mode: UIMode;
  forceApplySkin?: boolean;
  padUI: VirtualPadUI | null;
  bareUI: VirtualPadUIForBare | null;
}

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
export function createResizeHandler(app: Application, ctx: AppLayers, gameScreenSpec: GameScreenSpec, skins: SkinResolver, getViewState: () => ViewState) {
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
      const { mode, padUI, bareUI } = getViewState();
      onResize(app, ctx, gameScreenSpec, skins, w, h, { mode, forceApplySkin: false, padUI, bareUI } );
    });
  };
}
