import { Container, Sprite } from "pixi.js";

export interface UiContext {
  /** ルートコンテナ */
  root: Container;
  /** 背景 */
  background: Sprite;
  /** バーチャルキーUI/仮想ゲーム画面共通の親 */
  deviceLayer: Container;
  /** バーチャルキーUI */
  uiLayer: Container;
  /** 仮想ゲーム画面 */
  gameLayer: Container;

  // バーチャルキーUIに配置される Sprite
  /** バーチャルキーUIの本体画像(4分割) */
  body: Sprite[];
  /** バーチャルキーUIの方向キー */
  dpad: Sprite;
  /** バーチャルキーUIのボタン類(A,B,START,SELECT) */
  buttons: Sprite[];
}
