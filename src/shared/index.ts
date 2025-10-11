/**
 * @packageDocumentation
 * Shared 層（純ロジック/型のみ）
 * - ブラウザ・Pixi 依存禁止。テストしやすい純粋モジュール。
 * - App/Game どちらからも使ってよい。
 */
export * from "./types";
export * from "./input-state";
export * from "./utils";
