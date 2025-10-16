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

  // 区切り線
  separatorHeight: 1,        // 区切り線の高さ
  separatorWidthDiff: 4,     // 区切り線とウィンドウとの幅の差
  separatorOffsetX: 2,       // 区切り線を枠線の上に乗せる際の X 方向オフセット(separatorWidthDiff の左右片側分)
  separatorMarginTop: 4,     // 上の文字の下端から区切り線までのマージン
  separatorMarginBottom: 4,  // 区切り線下端から次の文字までのマージン

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
