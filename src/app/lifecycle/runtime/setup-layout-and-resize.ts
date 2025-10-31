import { bindKeyboard, createResizeHandler, onResize, relayoutViewport, relayoutViewportBare, RuntimeContext, UIMODE } from "../..";

export function setupLayoutAndResize(rc: RuntimeContext): () => void {
  if (rc.mode === UIMODE.PAD) {
    relayoutViewport(rc.app, rc.layers, rc.gameScreenSpec, rc.skins.current, window.innerWidth, window.innerHeight);
  }
  else {
    relayoutViewportBare(rc.app, rc.layers, rc.gameScreenSpec, window.innerWidth, window.innerHeight);
  }

  // 初回再描画
  onResize(rc, window.innerWidth, window.innerHeight, true);

  // リサイズハンドラの登録
  const opts = { signal: rc.abortController.signal } as AddEventListenerOptions;
  const handleResize = createResizeHandler(rc);
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
