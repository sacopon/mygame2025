/**
 * ウィンドウ関係の部品間で共通使用する定数定義
 */
export const DEFAULT_WINDOW_SETTINGS = Object.freeze({
  borderWidth: 4,
  borderHeight: 4,

  marginLeft: 4,
  marginTop: 4,
  marginRight: 4,
  marginBottom: 4,

  // フォント
  fontFamily: "BestTen",
  fontSize : 10,
  lineMargin: Math.floor(10 * 0.5),
  lineHeight: 10 + Math.floor(10 * 0.5),
  // 背景のアルファ値
  baseAlpha: 0.75,
  // カーソル
  cursorMarginX: -4,
  cursorBaselineTweak: -2,
});
