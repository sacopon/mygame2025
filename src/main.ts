import "./index.css";
import { Application, Assets, Container, Cache, Graphics, Sprite, Spritesheet, Texture } from "pixi.js";
import { skins, Skin } from "@/skin";

// ゲーム画面の内部サイズ
const GAME_SCREEN_WIDTH = 256;
const GAME_SCREEN_HEIGHT = 224;

let currentSkinIndex = -1;

let skin: Skin = skins[0];

let currentButtonState: number = 0;
let previousButtonState: number = 0;

function buildVirtualConsoleUi(skin: Skin, bodies: Sprite[], direction: Sprite, buttons: Sprite[]) {
  // ゲーム機本体
  bodies[0].texture = Texture.from(skin.body.images[0]);
  bodies[0].position.set(0, 0);
  bodies[1].texture = Texture.from(skin.body.images[1]);
  bodies[1].position.set(skin.body.size.width  / 2, 0);
  bodies[2].texture = Texture.from(skin.body.images[2]);
  bodies[2].position.set(0, skin.body.size.height / 2);
  bodies[3].texture = Texture.from(skin.body.images[3]);
  bodies[3].position.set(skin.body.size.width  / 2, skin.body.size.height / 2);

  // 方向キー
  direction.texture = Texture.from(skin.key.direction.image.neutral);
  direction.position.set(
    skin.key.direction.position.x,
    skin.key.direction.position.y);

  // その他ボタン
  buttons.forEach(button => button.visible = false);
  skin.key.buttons.forEach((button: any, i: number) => {
    buttons[i].texture = Texture.from(button.image.off);
    buttons[i].position.set(button.position.x, button.position.y);
    buttons[i].visible = true;
  });
}

function disableBrowserGestures() {
  // 共通禁止（右クリック・長押しメニュー・ダブルタップ等）
  window.addEventListener('contextmenu', e => e.preventDefault()); // 右クリック/長押しメニュー
  window.addEventListener('selectstart', e => e.preventDefault()); // テキスト選択開始
  window.addEventListener('dragstart', e => e.preventDefault());   // 画像ドラッグ

  // ホイール/タッチスクロール・ピンチズーム・ダブルタップズーム抑止
  const opts = { passive: false } as AddEventListenerOptions;
  window.addEventListener('wheel', e => e.preventDefault(), opts);
  window.addEventListener('touchmove', e => e.preventDefault(), opts);
  window.addEventListener('gesturestart', e => e.preventDefault() as any, opts); // iOS Safari 独自
  window.addEventListener('dblclick', e => e.preventDefault(), opts);

  // Android Chrome: バックキー/履歴誤タップ対策
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') e.preventDefault(); // 入力欄が無いのに Backspace で戻るのを防止
  });

  // スワイプバック誤動作軽減（完全には防げません）
  history.pushState(null, '', location.href);

  // このイベントコールバックでゲーム内ポーズを出す等.
  // ブラウザバック自体は戻さずにゲームへフォーカス返す
  window.addEventListener('popstate', () => history.pushState(null, '', location.href));
}

function registerPwaServiceWorker() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL }).catch(console.error);
    });
  }
}

function handleKeyDown(e: KeyboardEvent, directionPad: Sprite, buttons: Sprite[]) {
  if (e.key === "ArrowUp") {
    currentButtonState |= 1 << 0;
  } else if (e.key === "ArrowDown") {
    currentButtonState |= 1 << 1;
  } else if (e.key === "ArrowLeft") {
    currentButtonState |= 1 << 2;
  } else if (e.key === "ArrowRight") {
    currentButtonState |= 1 << 3;
  } else if (e.key === "z" || e.key === "Z") {
    currentButtonState |= 1 << 4;
  } else if (e.key === "x" || e.key === "X") {
    currentButtonState |= 1 << 5;
  } else if (e.key === "a" || e.key === "A") {
    currentButtonState |= 1 << 6;
  } else if (e.key === "s" || e.key === "S") {
    currentButtonState |= 1 << 7;
  }
}

function handleKeyUp(e: KeyboardEvent, directionPad: Sprite, buttons: Sprite[]) {
  if (e.key === "ArrowUp") {
    currentButtonState &= ~(1 << 0);
  } else if (e.key === "ArrowDown") {
    currentButtonState &= ~(1 << 1);
  } else if (e.key === "ArrowLeft") {
    currentButtonState &= ~(1 << 2);
  } else if (e.key === "ArrowRight") {
    currentButtonState &= ~(1 << 3);
  } else if (e.key === "z" || e.key === "Z") {
    currentButtonState &= ~(1 << 4);
  } else if (e.key === "x" || e.key === "X") {
    currentButtonState &= ~(1 << 5);
  } else if (e.key === "a" || e.key === "A") {
    currentButtonState &= ~(1 << 6);
  } else if (e.key === "s" || e.key === "S") {
    currentButtonState &= ~(1 << 7);
  }
}

function updateButtonImages(skin: Skin, directionPad: Sprite, buttons: Sprite[], currentButtonState: number, previousButtonState: number) {
  // ボタン状況に応じて画像を更新する
  if (((currentButtonState & (1 << 0)) ^ (previousButtonState & (1 << 0))) !== 0) {
    directionPad.texture = Texture.from((currentButtonState & (1 << 0)) ? skin.key.direction.image.up : skin.key.direction.image.neutral);
  }
  if (((currentButtonState & (1 << 1)) ^ (previousButtonState & (1 << 1))) !== 0) {
    directionPad.texture = Texture.from((currentButtonState & (1 << 1)) ? skin.key.direction.image.down : skin.key.direction.image.neutral);
  }
  if (((currentButtonState & (1 << 2)) ^ (previousButtonState & (1 << 2))) !== 0) {
    directionPad.texture = Texture.from((currentButtonState & (1 << 2)) ? skin.key.direction.image.left : skin.key.direction.image.neutral);
  }
  if (((currentButtonState & (1 << 3)) ^ (previousButtonState & (1 << 3))) !== 0) {
    directionPad.texture = Texture.from((currentButtonState & (1 << 3)) ? skin.key.direction.image.right : skin.key.direction.image.neutral);
  }
  if (((currentButtonState & (1 << 4)) ^ (previousButtonState & (1 << 4))) !== 0) {
    const buttonIndex = 0;
    if (buttonIndex < skin.key.buttons.length) {
      buttons[buttonIndex].texture = Texture.from((currentButtonState & (1 << 4)) ? skin.key.buttons[buttonIndex].image.on : skin.key.buttons[buttonIndex].image.off);
    }
  }
  if (((currentButtonState & (1 << 5)) ^ (previousButtonState & (1 << 5))) !== 0) {
    const buttonIndex = 1;
    if (buttonIndex < skin.key.buttons.length) {
      buttons[buttonIndex].texture = Texture.from((currentButtonState & (1 << 5)) ? skin.key.buttons[buttonIndex].image.on : skin.key.buttons[buttonIndex].image.off);
    }
  }
  if (((currentButtonState & (1 << 6)) ^ (previousButtonState & (1 << 6))) !== 0) {
    const buttonIndex = 2;
    if (buttonIndex < skin.key.buttons.length) {
      buttons[buttonIndex].texture = Texture.from((currentButtonState & (1 << 6)) ? skin.key.buttons[buttonIndex].image.on : skin.key.buttons[buttonIndex].image.off);
    }
  }
  if (((currentButtonState & (1 << 7)) ^ (previousButtonState & (1 << 7))) !== 0) {
    const buttonIndex = 3;
    if (buttonIndex < skin.key.buttons.length) {
      buttons[buttonIndex].texture = Texture.from((currentButtonState & (1 << 7)) ? skin.key.buttons[buttonIndex].image.on : skin.key.buttons[buttonIndex].image.off);
    }
  }
}

function resize(app: Application, rootContainer: Container, uiLayer: Container, gameLayer: Container, bgSprite: Sprite, bodySprites: Sprite[], directionPad: Sprite, buttons: Sprite[]) {
  // pixi.js による描画領域を再設定
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  app.renderer.resize(cw, ch);

  const nextSkinIndex = cw < ch ? 0 : 1;

  if (currentSkinIndex != nextSkinIndex) {
    skin = skins[nextSkinIndex];
    currentSkinIndex = nextSkinIndex;

    // 背景を画面中央に
    bgSprite.position.set(cw / 2, ch / 2);

    // UIレイヤーの pivot を本体画像のサイズに合わせて再設定
    uiLayer.pivot.set(
      skin.body.size.width  / 2,
      skin.body.size.height / 2
    );

    // UI を再配置
    buildVirtualConsoleUi(skin, bodySprites, directionPad, buttons);

    // game_layer を現在の skin のスクリーン位置・サイズに合わせ直す
    gameLayer.position.set(skin.screen.position.x, skin.screen.position.y);
    gameLayer.scale.set(skin.screen.size.width / GAME_SCREEN_WIDTH);
  }

  // 全体スケーリングとセンタリング
  const scale = Math.min(
    cw / skin.body.size.width,
    ch / skin.body.size.height);
  rootContainer.scale.set(scale);
  rootContainer.position.set((cw / 2) | 0, (ch / 2) | 0);
}

function handleResize(app: Application, rootContainer: Container, uiLayer: Container, gameLayer: Container, bgSprite: Sprite, bodySprites: Sprite[], directionPad: Sprite, buttons: Sprite[]) {
  resize(app, rootContainer, uiLayer, gameLayer, bgSprite, bodySprites, directionPad, buttons);
}

function drawGameSample(gameLayer: Container, smileTex: Texture) {
  // 赤い四角
  const g = new Graphics();
  g.rect(0, 0, GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT);
  g.fill({ color: 0xff0000, alpha: 1 });
  gameLayer.addChild(g);
  // 青い四角
  g.rect(0, 0, 16, 16);
  g.fill({ color: 0x0000ff, alpha: 1 });
  gameLayer.addChild(g);
  gameLayer.addChild(g);

  const smile = new Sprite(smileTex);
  smile.anchor.set(0.5);
  smile.position.set(GAME_SCREEN_WIDTH / 2, GAME_SCREEN_HEIGHT / 2);
  gameLayer.addChild(smile);
}

(async () => {
  const app = new Application();

  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1099bb,
    roundPixels: true,  // 描画座標に小数値が渡された場合に整数値に丸める
  });

  document.body.appendChild(app.canvas);

  // PWA の ServiceWorker を設定
  registerPwaServiceWorker();

  // ブラウザデフォルトのジェスチャ操作を禁止
  disableBrowserGestures();

  // キャンバスにフォーカスを集める
  app.canvas.setAttribute('tabindex', '0');
  app.canvas.addEventListener('pointerdown', () => app.canvas.focus());
  app.canvas.addEventListener('touchstart', () => app.canvas.focus(), { passive:false });

  // 画像読み込み
  const makePath = (path: string) => `${import.meta.env.BASE_URL}${path}`;
  const bg_texture = await Assets.load(makePath("textures/screen_bg.png"));
  await Assets.load(makePath("textures/virtualui.json"));
  const smile_tex = await Assets.load(makePath("textures/smile.png")) as Texture;
  smile_tex.source.scaleMode = "nearest";

  // 背景
  const bg_sprite = new Sprite(bg_texture);
  bg_sprite.anchor.set(0.5);
  app.stage.addChild(bg_sprite);

  // コンテナ作成
  const root_container = new Container();
  app.stage.addChild(root_container);

  // UI レイヤー
  const ui_layer = new Container();
  root_container.addChild(ui_layer);

  ui_layer.pivot.set(
    skin.body.size.width  / 2,
    skin.body.size.height / 2);

  // ゲーム機本体(UIレイヤー)
  const body_sprites: Sprite[] = [];
  for (let i = 0; i < 4; ++i) {
    const s = new Sprite();
    s.anchor.set(0);
    ui_layer.addChild(s);
    body_sprites.push(s);
  }

  // 方向キー(UIレイヤー)
  const direction_pad = Sprite.from(skin.key.direction.image.neutral);
  direction_pad.anchor.set(0.5);
  ui_layer.addChild(direction_pad);

  const buttons: Sprite[] = [];

  for (let i = 0; i < 4; ++i) {
    const button = skin.key.buttons[i];
    const sprite = new Sprite();
    sprite.anchor.set(0.5);
    sprite.visible = false;
    ui_layer.addChild(sprite);
    buttons.push(sprite);
  }

  // ゲーム画面レイヤー
  const game_layer = new Container();
  game_layer.position.set(
    skin.screen.position.x,
    skin.screen.position.y);
  game_layer.pivot.set(0, 0);
  game_layer.scale.set(skin.screen.size.width / GAME_SCREEN_WIDTH);
  ui_layer.addChild(game_layer);

  // ゲーム画面内のサンプル描画
  drawGameSample(game_layer, smile_tex);

  // キーボード入力イベント
  window.addEventListener("keydown", e => handleKeyDown(e, direction_pad, buttons));
  window.addEventListener("keyup", e => handleKeyUp(e, direction_pad, buttons));

  // 画面再構築が必要なイベントを登録
  // 回転・アドレスバー変動・PWA復帰など広めにカバー
  window.addEventListener("resize", () => handleResize(app, root_container, ui_layer, game_layer, bg_sprite, body_sprites, direction_pad, buttons));
  window.visualViewport?.addEventListener("resize", () => handleResize(app, root_container, ui_layer, game_layer, bg_sprite, body_sprites, direction_pad, buttons));
  window.addEventListener("orientationchange", () => handleResize(app, root_container, ui_layer, game_layer, bg_sprite, body_sprites, direction_pad, buttons));
  window.addEventListener("pageshow", () => handleResize(app, root_container, ui_layer, game_layer, bg_sprite, body_sprites, direction_pad, buttons));

  resize(app, root_container, ui_layer, game_layer, bg_sprite, body_sprites, direction_pad, buttons);

  // 毎フレーム呼ばれる処理を追加
  app.ticker.add(deltaTime => {
    // deltaTime は「前フレーム比の時間倍率」
    // 60FPSで1.0、120FPSで0.5、30FPSで2.0 ぐらいになる
    updateButtonImages(skin, direction_pad, buttons, currentButtonState, previousButtonState);
    previousButtonState = currentButtonState;
  });
})();
