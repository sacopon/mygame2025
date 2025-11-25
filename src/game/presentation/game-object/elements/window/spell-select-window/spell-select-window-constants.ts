import { DEFAULT_WINDOW_SETTINGS } from "../constants/window-constants";

/**
 * 呪文選択ウィンドウ関係の部品間で共通使用する定数定義
 */
export const SPELL_SELECT_WINDOW_SETTINGS = Object.freeze({
  ...DEFAULT_WINDOW_SETTINGS,
  // 2列x3行の選択ウィンドウ
  GRID_COLUMNS: 2,
  GRID_ROWS: 3,
});
