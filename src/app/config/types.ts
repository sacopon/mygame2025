import { Container, Graphics, Sprite } from "pixi.js";
import { ViewportMetrics } from "@app/services/viewport";
import { GameRoot } from "@game/core";

export interface AppContext {
  /** ルートコンテナ */
  root: Container;
  /** 背景 */
  background: Sprite;
  /** バーチャルキーUI/仮想ゲーム画面共通の親 */
  deviceLayer: Container;
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
  /** ビューポート管理 */
  viewportMetrics: ViewportMetrics;

  /** ゲーム側のルート */
  gameRoot: GameRoot;
}

export interface VirtualPadSlots {
  // /** バーチャルキーUI */
  // uiLayer: Container;
  // バーチャルキーUIに配置される Sprite
  /** バーチャルキーUIの本体画像(4分割) */
  body: Sprite[];
  /** バーチャルキーUIの方向キー */
  dpad: Sprite;
  /** バーチャルキーUIのボタン類(A,B,START,SELECT) */
  buttons: Sprite[];
}
