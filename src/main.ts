import "./index.css";
import { Application, Assets, Container, Graphics, Sprite, Spritesheet } from "pixi.js";

// 全体のサイズ
const BASE_WIDTH = 720;
const BASE_HEIGHT = 1280;

// ゲーム画面の内部サイズ
const GAME_SCREEN_WIDTH = 360;
const GAME_SCREEN_HEIGHT = 240;

// 実際のUI上のゲーム画面サイズ
const GAME_SCREEN_UI_WIDTH = 468;
const GAME_SCREEN_UI_HEIGHT = 312;

// 実際のUI上のゲームサイズとゲーム画面内部サイズの比率
const GAME_SCREEN_SCALE = GAME_SCREEN_UI_WIDTH / GAME_SCREEN_WIDTH;

// 実際のUI上のゲーム画面の位置
const GAME_SCREEN_UI_X = (152 + GAME_SCREEN_UI_WIDTH / 2) - BASE_WIDTH / 2;
const GAME_SCREEN_UI_Y = (235 + GAME_SCREEN_UI_HEIGHT / 2) - BASE_HEIGHT / 2;

(async () => {
  const app = new Application();

  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1099bb,
    roundPixels: true,
  });

  document.body.appendChild(app.canvas);

  // 画像読み込み
  const bg_texture = await Assets.load("/textures/screen_bg.png");
  const vpad_sprite_sheet = await Assets.load("/textures/virticalui.json");

  // 背景
  const bg_sprite = new Sprite(bg_texture);
  app.stage.addChild(bg_sprite);

  // コンテナ作成
  const root_container = new Container();
  app.stage.addChild(root_container);

  // UI レイヤー
  const ui_layer = new Container();
  const body_sprite = new Sprite(vpad_sprite_sheet.textures["body.png"]);
  body_sprite.anchor.set(0.5);
  ui_layer.addChild(body_sprite);
  root_container.addChild(ui_layer);

  // ゲーム画面レイヤー
  const game_layer = new Container();
  game_layer.position.set(GAME_SCREEN_UI_X, GAME_SCREEN_UI_Y);
  game_layer.scale.set(GAME_SCREEN_SCALE);
  root_container.addChild(game_layer);

  // ゲーム画面内のサンプル描画
  {
    // 赤い四角
    const g = new Graphics();
    g.rect(-GAME_SCREEN_WIDTH / 2, -GAME_SCREEN_HEIGHT / 2, GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT);
    g.fill({ color: 0xff0000, alpha: 1 });
    game_layer.addChild(g);
    // 青い四角
    g.rect(0, 0, 16, 16);
    g.fill({ color: 0x0000ff, alpha: 1 });
    game_layer.addChild(g);
    // 緑い四角
    g.rect(16, 0, 16, 16);
    g.fill({ color: 0x00ff00, alpha: 1 });
    game_layer.addChild(g);
  }

  function resize() {
    // pixi.js による描画領域を再設定
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    app.renderer.resize(cw, ch);

    // スケール計算
    const scale = Math.min(cw / BASE_WIDTH, ch / BASE_HEIGHT);
    root_container.scale.set(scale);

    // 描画範囲(ウィンドウ全体)の中央に配置
    root_container.position.set(~~(cw / 2), ~~(ch / 2));
  }

  window.addEventListener("resize", resize);
  resize();

})();
