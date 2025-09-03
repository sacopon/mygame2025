import { Application } from "pixi.js";
import { type UiContext } from "@/app";
import { SkinResolver } from "@/app/skin/resolver";
import { applySkin } from "@/app/ui/applySkin";
import { relayoutViewport } from "@/app/ui/layout";
import { UIMode } from "@/app/ui/mode";
import { relayoutViewportBare } from "@/app/ui/layout-bare";
import { DefaultScreen, GameScreenSpec } from "../screen/screen-spec";

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
export function createResizeHandler(app: Application, ctx: UiContext, gameScreenSpec: GameScreenSpec, skins: SkinResolver, getMode: () => UIMode) {
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
      onResize(app, ctx, gameScreenSpec, skins, w, h, false, getMode());
    });
  };
}

/**
 * サイズ(w,h)を受け取り、必要なら Skin を切替＆レイアウト反映
 */
export function onResize(app: Application, ctx: UiContext, gameScreenSpec: GameScreenSpec, skins: SkinResolver, w: number, h: number, forceApplySkin = false, mode: UIMode = "pad"): void {
  const skinChanged = skins.update(w, h);

  if (mode === "pad") {
    // バーチャルキーUIの場合は従来の仮想解像度へ戻す
    gameScreenSpec.update(DefaultScreen)

    // スキンが変わった時だけテクスチャの張り替えを行う
    if (skinChanged || forceApplySkin) {
      applySkin(ctx, skins.current);
    }

    // ビューポートの更新は常に行う
    relayoutViewport(app, ctx, gameScreenSpec, skins.current, w, h);
  }
  else {
    // バーチャルキーUIなしの場合は仮想解像度を再計算する
    gameScreenSpec.update(GameScreenSpec.computeBareVirtualScreen(w, h));
    relayoutViewportBare(app, ctx, gameScreenSpec, w, h, false);
  }

  // 現在のスクリーン矩形・スケールを知らせる（ゲームはこれで投影更新）
  const { width: vw, height: vh } = gameScreenSpec.current;
  // pad の gameLayer スケールは skin 幅 / 仮想幅、bare は短辺フィットの値
  const scale =
    mode === "pad"
      ? (skins.current.screen.size.width / vw)
      : Math.min(w / vw, h / vh) | 0;  // 整数化してるなら同じ丸めに揃える

  const screenW = vw * scale;
  const screenH = vh * scale;
  const screenX = ((w - screenW) / 2) | 0;
  const screenY = ((h - screenH) / 2) | 0;

// TODO(viewportmetrics): 必要になったら発火する
// viewportMetrics.update({
//   view:   { w, h },
//   screen: { x: screenX, y: screenY, w: screenW, h: screenH },
//   scale,
//   mode
// });

  app.render();
}
