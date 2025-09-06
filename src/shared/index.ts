/**
 * @packageDocumentation
 * Shared 層（純ロジック/型のみ）
 * - ブラウザ・Pixi 依存禁止。テストしやすい純粋モジュール。
 * - App/Game どちらからも使ってよい。
 */
export {
  type Position,
  type Size,
  PAD_BIT,
} from "./types";

export {
  InputState,
} from "./input-state";
