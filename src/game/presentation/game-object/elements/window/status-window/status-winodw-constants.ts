import { DEFAULT_WINDOW_SETTINGS } from "../constants/window-constants";

/**
 * ステータスウィンドウ関係の部品間で共通使用する定数定義
 */
export const STATUS_WINDOW_SETTINGS = Object.freeze({
  ...DEFAULT_WINDOW_SETTINGS,
  marginTop: DEFAULT_WINDOW_SETTINGS.marginTop - 2,
  marginBottom: DEFAULT_WINDOW_SETTINGS.marginBottom - 6,
  width: 224,
});
