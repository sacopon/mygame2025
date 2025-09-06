/**
 * @packageDocumentation
 * App/UI 下の公開窓口。
 * - 役割: 仮想パッド構築、レイアウト適用、スキンの見た目更新
 * - 依存: app/screen, app/skin, shared は OK。core は UI イベント補助のみ。
 */
export {
  applySkin,
} from "./applySkin";

export {
  relayoutViewport,
  relayoutViewportBare,
  type UIMode,
  updateButtonImages,
} from "./layout";

export {
  buildUiContext,
  enableButtonTouch,
  enableDpadTouch,
} from "./virtualpad";
