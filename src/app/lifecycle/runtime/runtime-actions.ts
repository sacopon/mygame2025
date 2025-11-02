import { computeViewMetrics, DefaultScreen, GameScreenSpec, relayoutViewport, relayoutViewportBare, UIMODE, VirtualPadUI } from "../..";
import { RuntimeContext } from "./runtime-context";
import { getSafeAreaInsets } from "@core";

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

  onResize(rc, window.innerWidth, window.innerHeight, true);
}

/**
 * サイズ(w,h)を受け取り、必要なら Skin を切替＆レイアウト反映
 */
export function onResize(rc: RuntimeContext, w: number, h: number, forceApplySkin: boolean = false): void {
  const safeAreaInsets = getSafeAreaInsets();
  rc.muteButton.position.set(safeAreaInsets.left + rc.muteButton.width / 2, safeAreaInsets.top + rc.muteButton.height / 2);
  rc.bareButton.position.set(
    rc.muteButton.x + Math.floor(rc.muteButton.width / 2) + 24 + rc.bareButton.width / 2,
    rc.muteButton.y - Math.floor(rc.muteButton.height / 2) + Math.floor(rc.bareButton.height / 2));

  const skinChanged = rc.skins.update(w, h);

  if (rc.mode === UIMODE.PAD) {
    // バーチャルキーUIの場合は従来の仮想解像度へ戻す
    rc.gameScreenSpec.update(DefaultScreen);

    // スキンが変わった時だけテクスチャの張り替えを行う
    if (rc.padUI && (skinChanged || forceApplySkin)) {
      rc.padUI.applySkin(rc.skins.current);
    }

    // ビューポートの更新は常に行う
    relayoutViewport(rc.app, rc.layers, rc.gameScreenSpec, rc.skins.current, w, h);
  }
  else {
    // バーチャルキーUIなしの場合は仮想解像度を再計算する
    rc.gameScreenSpec.update(GameScreenSpec.computeBareVirtualScreen(w, h));
    relayoutViewportBare(rc.app, rc.layers, rc.gameScreenSpec, w, h);
  }

  const { width: vw, height: vh } = rc.gameScreenSpec.current;
  // ゲーム画面のマスク領域を更新
  // 透過でもOK. 色は何でも構わない
  rc.layers.gameLayerMask.clear();
  rc.layers.gameLayerMask.rect(0, 0, vw, vh).fill({ color: 0xffffff, alpha: 1 });

  rc.layers.viewportMetrics.update(
    computeViewMetrics(
      rc.mode,
      w,
      h,
      rc.gameScreenSpec.current,
      rc.mode === UIMODE.PAD ? rc.skins.current : undefined));

  rc.app.render();
  rc.bareUI.onResize(w, h);
  rc.bareUIShower.position.set(0, 0);
}
