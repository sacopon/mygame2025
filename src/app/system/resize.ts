import { Application } from "pixi.js";
import { UiContext } from "@/app/types";
import { SkinResolver } from "@/app/skin/resolver";
import { applySkin } from "@/app/ui/applySkin";
import { relayoutViewport } from "@/app/ui/layout";

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
export function createResizeHandler(app: Application, ctx: UiContext, skins: SkinResolver) {
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
      onResize(app, ctx, skins, w, h);
    });
  };
}

/**
 * サイズ(w,h)を受け取り、必要なら Skin を切替＆レイアウト反映
 */
export function onResize(app: Application, ctx: UiContext, skins: SkinResolver, w: number, h: number, forceApplySkin = false): void {
  const changed = skins.update(w, h);

  // スキンが変わった時だけテクスチャの張り替えを行う
  if (changed || forceApplySkin) {
    applySkin(ctx, skins.current);
  }

  // ビューポートの更新は常に行う
  relayoutViewport(app, ctx, skins.current, w, h);
  app.render();
}
