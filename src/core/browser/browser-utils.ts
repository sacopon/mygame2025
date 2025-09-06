/**
 * ゲームに不要なブラウザのタッチジェスチャを抑止する設定を行う
 */
export function disableBrowserGestures(canvas: HTMLCanvasElement) {
  // 共通禁止（右クリック・長押しメニュー・ダブルタップ等）
  window.addEventListener("contextmenu", e => e.preventDefault()); // 右クリック/長押しメニュー
  window.addEventListener("selectstart", e => e.preventDefault()); // テキスト選択開始
  window.addEventListener("dragstart", e => e.preventDefault());   // 画像ドラッグ
  window.addEventListener("dblclick", e => e.preventDefault(), { passive: false, capture: true });
  window.addEventListener("gesturestart", e => e.preventDefault(), { passive: false, capture: true }); // iOS専用

  // ホイール/タッチスクロール・ピンチズーム・ダブルタップズーム抑止
  window.addEventListener("wheel", e => e.preventDefault(), { passive: false });

  // Android Chrome: バックキー/履歴誤タップ対策
  window.addEventListener("keydown", e => {
    if (e.key === "Backspace") {
      e.preventDefault(); // 入力欄が無いのに Backspace で戻るのを防止
    }
  });

  // スワイプバック誤動作軽減（完全には防げません）
  if (history.length <= 1) {
    history.replaceState(null, "", location.href);
  }
  else {
    history.pushState(null, "", location.href);
  }

  // このイベントコールバックでゲーム内ポーズを出す等.
  // ブラウザバック自体は戻さずにゲームへフォーカス返す
  window.addEventListener("popstate", () => history.pushState(null, "", location.href));

  // キャンバスにフォーカスを集める
  canvas.setAttribute("tabindex", "0");
  canvas.addEventListener("pointerdown", () => canvas.focus());
  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    canvas.focus();
  }, { passive: false });
  // ジェスチャ干渉によるponterイベント欠落を防止する
  canvas.style.touchAction = "none";

  // もし選択状態が発生したら強制解除
  const clearSelection = () => {
    const sel = window.getSelection?.();
    if (sel && sel.rangeCount) sel.removeAllRanges();
    const ae = document.activeElement as HTMLElement | null;
    if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable)) {
      ae.blur();
    }
  };

  const opts = { passive:false } as AddEventListenerOptions;
  ["pointerdown", "touchstart", "mousedown"].forEach(type => {
    window.addEventListener(type, () => clearSelection(), opts);
  });
}

/**
 * PWA 用の ServiceWorker の登録を行う
 */
export function registerPwaServiceWorker(serviceWokerPath: string) {
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(serviceWokerPath, { scope: import.meta.env.BASE_URL })
        .catch(console.error);
    });
  }
}
