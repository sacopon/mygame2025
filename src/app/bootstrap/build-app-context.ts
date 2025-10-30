import { Container, Graphics, Sprite } from "pixi.js";
import { AppContext, ViewportMetrics } from "..";

export function buildAppContext(parent: Container): AppContext {
  // コンテナ作成
  const root = new Container();
  parent.addChild(root);

  // 背景
  const background = Sprite.from("screen_bg.png");
  background.anchor.set(0.5);
  root.addChild(background);

  // バーチャルパッドUIとゲーム画面の共通の親
  const deviceLayer = new Container();
  root.addChild(deviceLayer);

  // ベアモード用UIのレイヤー
  const bareUiLayer = new Container();
  root.addChild(bareUiLayer);

  // ゲーム画面外のUI 用
  const appUiLayer = new Container();
  root.addChild(appUiLayer);

  // 仮想のゲーム機本体(仮想ゲーム画面の背面に置かれる画像)用のレイヤー
  const frameLayer = new Container();
  // ゲーム画面レイヤー
  const gameLayer = new Container();

  // ゲーム画面内の描画がはみ出さないようにマスク
  const gameLayerMask = new Graphics();
  gameLayerMask.eventMode = "none";
  gameLayer.addChild(gameLayerMask);  // マスクの座標系をマスクをかけるレイヤーの座標系にするため gameLayer の子にする
  gameLayer.mask = gameLayerMask;

  // ゲーム画面の中身用コンテナ(ゲーム画面コンテナを全削除した際にマスクまで削除してしまわないように分ける)
  const gameContentLayer = new Container();
  gameContentLayer.sortableChildren = true;
  gameLayer.addChild(gameContentLayer);

  // 仮想のゲーム機UI(仮想ゲーム画面の前面に置かれる画像)用のレイヤー
  const overlayLayer = new Container();

  deviceLayer.addChild(frameLayer);   // 本体
  deviceLayer.addChild(gameLayer);    // 画面
  deviceLayer.addChild(overlayLayer); // ボタン

  // 何も入れないうちはイベントを拾わないようにしておく
  frameLayer.eventMode = "none";
  overlayLayer.eventMode = "none";

  const viewportMetrics = new ViewportMetrics();

  return {
    root,
    background,
    deviceLayer,
    frameLayer,
    gameLayer,
    gameContentLayer,
    gameLayerMask,
    overlayLayer,
    bareUiLayer,
    appUiLayer,
    viewportMetrics,
  };
}
