/**
 * ゲームに不要なブラウザのタッチジェスチャを抑止する設定を行う
 */
function disableBrowserGestures(canvas: HTMLCanvasElement) {
  // 共通禁止（右クリック・長押しメニュー・ダブルタップ等）
  window.addEventListener("contextmenu", e => e.preventDefault()); // 右クリック/長押しメニュー
  window.addEventListener("selectstart", e => e.preventDefault()); // テキスト選択開始
  window.addEventListener("dragstart", e => e.preventDefault());   // 画像ドラッグ

  // ホイール/タッチスクロール・ピンチズーム・ダブルタップズーム抑止
  window.addEventListener("wheel", e => e.preventDefault(), { passive: false });

  // Android Chrome: バックキー/履歴誤タップ対策
  window.addEventListener("keydown", e => {
    if (e.key === "Backspace") {
      e.preventDefault(); // 入力欄が無いのに Backspace で戻るのを防止
    }
  });

  // スワイプバック誤動作軽減（完全には防げません）
  history.pushState(null, "", location.href);

  // このイベントコールバックでゲーム内ポーズを出す等.
  // ブラウザバック自体は戻さずにゲームへフォーカス返す
  window.addEventListener("popstate", () => history.pushState(null, "", location.href));

  // キャンバスにフォーカスを集める
  canvas.setAttribute("tabindex", "0");
  canvas.addEventListener("pointerdown", () => canvas.focus());
  canvas.addEventListener("touchstart", () => canvas.focus(), { passive: false });
  // ジェスチャ干渉によるponterイベント欠落を防止する
  canvas.style.touchAction = "none";
}

/**
 * PWA 用の ServiceWorker の登録を行う
 */
function registerPwaServiceWorker(serviceWokerPath: string) {
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(serviceWokerPath, { scope: import.meta.env.BASE_URL })
        .catch(console.error);
    });
  }
}

export {
  disableBrowserGestures,
  registerPwaServiceWorker,
};
