import { DEFAULT_WINDOW_SETTINGS } from "@game/game-object/window/constants";

/**
 * キャラクターコマンド選択ウィンドウ関係の部品間で共通使用する定数定義
 */
export const COMMAND_SELECT_WINDOW_SETTINGS = Object.freeze({
  borderHeight: DEFAULT_WINDOW_SETTINGS.borderHeight,
  marginTop: DEFAULT_WINDOW_SETTINGS.marginTop,
  marginBottom: DEFAULT_WINDOW_SETTINGS.marginBottom,
  fontFamily: DEFAULT_WINDOW_SETTINGS.fontFamily,
  fontSize : DEFAULT_WINDOW_SETTINGS.fontSize,
  lineMargin: DEFAULT_WINDOW_SETTINGS.lineMargin,
  lineHeight: DEFAULT_WINDOW_SETTINGS.lineHeight,
  baseAlpha: DEFAULT_WINDOW_SETTINGS.baseAlpha,

  //　このウィンドウの固有値
  maxLines: 4,
});
