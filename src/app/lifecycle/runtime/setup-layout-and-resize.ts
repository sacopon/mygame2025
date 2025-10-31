import { bindKeyboard, createResizeHandler, onResize, relayoutViewport, relayoutViewportBare, RuntimeContext, UIMODE } from "../..";

export function setupLayoutAndResize(rc: RuntimeContext): () => void {
  if (rc.mode === UIMODE.PAD) {
    relayoutViewport(rc.app, rc.layers, rc.gameScreenSpec, rc.skins.current, window.innerWidth, window.innerHeight);
  }
  else {
    relayoutViewportBare(rc.app, rc.layers, rc.gameScreenSpec, window.innerWidth, window.innerHeight);
  }

  // 初回再描画
  onResize(rc.app, rc.layers, rc.gameScreenSpec, rc.skins, window.innerWidth, window.innerHeight, { mode: rc.mode, forceApplySkin: true, padUI: rc.padUI, bareUI: rc.bareUI });

  // リサイズハンドラの登録
  const opts = { signal: rc.abortController.signal } as AddEventListenerOptions;
  const handleResize = createResizeHandler(rc.app, rc.layers, rc.gameScreenSpec, rc.skins, () => ({ mode: rc.mode, padUI: rc.padUI, bareUI: rc.bareUI }));
  window.addEventListener("resize", handleResize, opts);
  window.visualViewport?.addEventListener("resize", handleResize, opts);
  window.addEventListener("orientationchange", handleResize, opts);
  window.addEventListener("pageshow", handleResize, opts);

  // // 仮想解像度が変わったら「再構築」（シーン作り直し/タイル再ロード等）
  // gameScreenSpec.addEventListener(VIRTUAL_SCREEN_CHANGE, (_ev: Event) => {
  // }, { signal: ac.signal });

  const unbindKeyboard = bindKeyboard(window, rc.inputState);
  return unbindKeyboard;
}
