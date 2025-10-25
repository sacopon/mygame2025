import { DEFAULT_WINDOW_SETTINGS } from "../constants/window-constants";

/**
 * 敵選択ウィンドウ関係の部品間で共通使用する定数定義
 */
export const ENEMY_SELECT_WINDOW_SETTINGS = Object.freeze({
  ...DEFAULT_WINDOW_SETTINGS,
  // このウィンドウの固有値
  maxLines: 4,
});
