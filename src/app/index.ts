/**
 * @packageDocumentation
 * App 層（UIホスト・アダプタ）
 * - 役割: ブラウザ/Pixi の土台、スキン適用、レイアウト、入力アダプタ（→ InputState）
 * - 依存ポリシー:
 *   - 依存して良い: shared, core
 *   - 依存してはいけない: game（循環防止）
 * - 注意:
 *   - ここは公開APIの窓口。再エクスポートのみ。ロジックは書かない。
 *   - 型は `export type` で再エクスポートしてランタイム依存を作らない。
 */
export {
  GAME_SCREEN,
} from "./constants";

export {
  type UiContext,
} from "./types";

export {
  type GameScreen,
  type VirtualScreenChangeEvent,
  DefaultScreen,
  VIRTUAL_SCREEN_CHANGE,
  GameScreenSpec,
} from "./screen";

export {
  type Skin,
  SkinResolver,
} from "./skin";
