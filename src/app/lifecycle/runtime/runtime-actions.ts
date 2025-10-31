import { Application } from "pixi.js";
import { AppLayers, computeViewMetrics, DefaultScreen, GameScreenSpec, relayoutViewport, relayoutViewportBare, ResizeOptions, SkinResolver, UIMODE, VirtualPadUI } from "../..";
import { RuntimeContext } from "./runtime-context";

export function toggleMode(rc: RuntimeContext): void {
  if (rc.mode === UIMODE.PAD) {
    rc.padUI.detach();
    rc.bareUI.onResize(window.innerWidth, window.innerHeight);
    rc.bareUI.show();
    rc.bareUIShower.setEnable(true);
    rc.mode = UIMODE.BARE;
  }
  else {
    rc.bareUI.hide();
    rc.bareUIShower.setEnable(false);

    if (!rc.padUI) {
      rc.padUI = VirtualPadUI.attach(rc.layers, rc.skins.current, rc.inputState);
    } else {
      rc.padUI.reattach();
    }

    rc.mode = UIMODE.PAD;
  }

  onResize(rc.app, rc.layers, rc.gameScreenSpec, rc.skins, window.innerWidth, window.innerHeight, { mode: rc.mode, forceApplySkin: true, padUI: rc.padUI, bareUI: rc.bareUI });
}

/**
 * サイズ(w,h)を受け取り、必要なら Skin を切替＆レイアウト反映
 */
export function onResize(app: Application, ctx: AppLayers, gameScreenSpec: GameScreenSpec, skins: SkinResolver, w: number, h: number, { mode, forceApplySkin = false, padUI = null, bareUI = null }: ResizeOptions): void {
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
    relayoutViewportBare(app, ctx, gameScreenSpec, w, h);
  }

  const { width: vw, height: vh } = gameScreenSpec.current;
  // ゲーム画面のマスク領域を更新
  // 透過でもOK. 色は何でも構わない
  ctx.gameLayerMask.clear();
  ctx.gameLayerMask.rect(0, 0, vw, vh).fill({ color: 0xffffff, alpha: 1 });

  ctx.viewportMetrics.update(
    computeViewMetrics(
      mode,
      w,
      h,
      gameScreenSpec.current,
      mode === UIMODE.PAD ? skins.current : undefined));

  app.render();
  bareUI?.onResize(w, h);
}
