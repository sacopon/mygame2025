/**
 * @packageDocumentation
 * 低レベルブラウザユーティリティ.
 * - App から呼ばれることを想定.
 * - App/Shared/Game の型に依存しない.
 */
export {
  disableBrowserGestures,
  registerPwaServiceWorker,
} from "./browser-utils";
