/**
 * 初回画面タッチ時にコールバックを設定する
 */
export function setFirstTouchCallback(callback: () => void): void {
  let fired = false;

  const handler = () => {
    if (fired) { return; }
    fired = true;
    callback();
  };

  const opts = { once: true, capture: true } as AddEventListenerOptions;
  window.addEventListener("pointerdown", handler, opts);
  window.addEventListener("mousedown",   handler, opts);
  window.addEventListener("touchstart",  handler, opts);
  window.addEventListener("keydown",     handler, opts);
  window.addEventListener("click",       handler, opts);
}
