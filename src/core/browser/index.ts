/**
 * @packageDocumentation
 * 低レベルブラウザユーティリティ.
 * - App から呼ばれることを想定.
 * - App/Shared/Game の型に依存しない.
 */
export * from "./disable-browser-gestures";
export * from "./is-ios";
export * from "./is-safari";
export * from "./make-path";
export * from "./register-pwa-service-worker";
export * from "./set-first-touch-callback";
export * from "./wait-by-raf";
