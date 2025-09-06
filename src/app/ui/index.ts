/**
 * @packageDocumentation
 * App/UI 下の公開窓口。
 * - 役割: 仮想パッド構築、レイアウト適用、スキンの見た目更新
 * - 依存: app/screen, app/skin, shared は OK。core は UI イベント補助のみ。
 */
export {
  relayoutViewport,
  relayoutViewportBare,
} from "./layout";

export {
  UIMODE,
  type UIMode,
  isUIMode,
} from "./mode";

export {
  VirtualPadUI,
} from "./virtual-pad-ui";
