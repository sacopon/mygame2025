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
