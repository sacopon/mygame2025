import { Application } from "pixi.js";
import { AppContext } from "@app/config";
import { relayoutViewport, relayoutViewportBare } from "@app/features/ui/layout";
import { UIMODE, UIMode } from "@app/features/ui/mode";
import { VirtualPadUI } from "@app/features/ui/virtual-pad";
import { DefaultScreen, GameScreenSpec } from "@app/services/screen";
import { SkinResolver } from "@app/features/ui/skin";

export type ResizeOptions = {
  mode: UIMode;
  forceApplySkin?: boolean;
  padUI: VirtualPadUI | null;
}

export type ViewState = {
  mode: UIMode,
  padUI: VirtualPadUI | null;
}

// TODO: main.ts 側に移したい
function updateGameMask(context: AppContext, vw: number, vh: number) {
  const g = context.gameLayerMask;
  g.clear();
  g.rect(0, 0, vw, vh).fill({ color: 0xffffff, alpha: 1 }); // 透過でもOK. 色は何でも構わない
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
export function createResizeHandler(app: Application, ctx: AppContext, gameScreenSpec: GameScreenSpec, skins: SkinResolver, getViewState: () => ViewState) {
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
      const { mode, padUI } = getViewState();
      onResize(app, ctx, gameScreenSpec, skins, w, h, { mode, forceApplySkin: false, padUI } );
    });
  };
}

/**
 * サイズ(w,h)を受け取り、必要なら Skin を切替＆レイアウト反映
 */
export function onResize(app: Application, ctx: AppContext, gameScreenSpec: GameScreenSpec, skins: SkinResolver, w: number, h: number, { mode, forceApplySkin = false, padUI = null }: ResizeOptions): void {
  const skinChanged = skins.update(w, h);

  if (mode === UIMODE.PAD) {
    // バーチャルキーUIの場合は従来の仮想解像度へ戻す
    gameScreenSpec.update(DefaultScreen);

    // スキンが変わった時だけテクスチャの張り替えを行う
    if (padUI && (skinChanged || forceApplySkin)) {
      padUI.applySkin(skins.current);
    }

    // ビューポートの更新は常に行う
    relayoutViewport(app, ctx, gameScreenSpec, skins.current, w, h);
  }
  else {
    // バーチャルキーUIなしの場合は仮想解像度を再計算する
    gameScreenSpec.update(GameScreenSpec.computeBareVirtualScreen(w, h));
    relayoutViewportBare(app, ctx, gameScreenSpec, w, h, false);
  }

  const { width: vw, height: vh } = gameScreenSpec.current;
  // pad の gameLayer スケールは skin 幅 / 仮想幅、bare は短辺フィットの値
  const scale =
    mode === UIMODE.PAD
      ? (skins.current.screen.size.width / vw)
      : Math.min(w / vw, h / vh) | 0;  // 整数化してるなら同じ丸めに揃える

  const screenW = (vw * scale) | 0;
  const screenH = (vh * scale) | 0;
  const screenX = ((w - screenW) / 2) | 0;
  const screenY = ((h - screenH) / 2) | 0;

  // ゲーム画面のマスク領域を更新
  updateGameMask(ctx, gameScreenSpec.current.width, gameScreenSpec.current.height);

  // TODO(viewportmetrics): 必要になったら発火する
  // 現在のスクリーン矩形・スケールを知らせる（ゲームはこれで投影更新）
  // viewportMetrics.update({
  //   view:   { w, h },
  //   screen: { x: screenX, y: screenY, w: screenW, h: screenH },
  //   scale,
  //   mode
  // });

  app.render();
}
