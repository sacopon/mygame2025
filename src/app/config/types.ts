import { Container, Graphics, Sprite } from "pixi.js";
import { ViewportMetrics } from "@app/services";

export interface AppLayers {
  /** ルートコンテナ */
  root: Container;
  /** 背景用レイヤ */
  background: Container;
  /** バーチャルキーUI/仮想ゲーム画面共通の親 */
  deviceLayer: Container;
  /** ベアモードUI */
  bareUiLayer: Container;
  /** 仮想のゲーム機本体(仮想ゲーム画面の背面に置かれる画像)用のレイヤー */
  frameLayer: Container;
  /** 仮想ゲーム画面(中身 + マスク) */
  gameLayer: Container;
  /** 仮想ゲーム画面(中身用) */
  gameContentLayer: Container;
  /** 仮想ゲーム画面用のマスク */
  gameLayerMask: Graphics;
  /** 仮想のゲーム機UI(仮想ゲーム画面の前面に置かれる画像)用のレイヤー */
  overlayLayer: Container;
  /** アプリUI用のレイヤー */
  appUiLayer: Container;
  /** ビューポート管理 */
  // TODO: RuntimeContext に移動？
  viewportMetrics: ViewportMetrics;
}

export interface VirtualPadSlots {
  /** バーチャルキーUIの本体画像(4分割) */
  body: Sprite[];
  /** バーチャルキーUIの方向キー */
  dpad: Sprite;
  /** バーチャルキーUIのボタン類(A,B,START,SELECT) */
  buttons: Sprite[];
}
