import "./index.css";
import { Application, Assets, Container, FederatedPointerEvent, Graphics, Sprite, Texture } from "pixi.js";
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

function setButtonStateBit(bit: number, down: boolean) {
  if (down) {
    currentButtonState |= (1 << bit);
    return;
  }

  currentButtonState &= ~(1 << bit);
}

function isChangedButtonState(bit: number): boolean {
  return ((currentButtonState & (1 << bit)) ^ (previousButtonState & (1 << bit))) !== 0;
}

function isPressingButton(bit: number): boolean {
  return (currentButtonState & (1 << bit)) !== 0;
}

function enableButtonTouch(sprite: Sprite, bit: number) {
  sprite.eventMode = 'static';
  sprite.cursor = 'pointer';

  const downs = new Set<number>(); // 押下中の pointerId を保持

  sprite.on('pointerdown', e => {
    downs.add(e.pointerId);
    setButtonStateBit(bit, true);
  });

  const onUp = (e: any) => {
    downs.delete(e.pointerId);

    if (downs.size === 0) {
      setButtonStateBit(bit, false);
    }
  };

  sprite.on('pointerup', onUp);
  sprite.on('pointerupoutside', onUp);
  sprite.on('pointercancel', onUp);
}

function enableDpadTouch(sprite: Sprite) {
  sprite.eventMode = 'static';
  sprite.cursor = 'pointer';

  const downs = new Set<number>(); // dpadを押している指の集合

  const setDirFromLocalPoint = (lx: number, ly: number) => {
    // まず上下左右ビット(0..3)を全クリア
    currentButtonState &= ~0b1111;

    // シンプルに x/y の絶対値で4方向を決定（斜めは大きい方を優先）
    const ax = Math.abs(lx), ay = Math.abs(ly);
    let bit = -1;
    if (ax > ay) {
      bit = (lx < 0) ? 2 : 3;   // 左:2, 右:3
    } else {
      bit = (ly < 0) ? 0 : 1;   // 上:0, 下:1
    }
    setButtonStateBit(bit, true);
  };

  const onMoveIfActive = (e: FederatedPointerEvent) => {
    if (!downs.has(e.pointerId)) {
      return;
    }

    const p = e.getLocalPosition(sprite); // スプライト座標系
    setDirFromLocalPoint(p.x, p.y);
  };

  sprite.on('pointerdown', e => {
    downs.add(e.pointerId);
    const p = e.getLocalPosition(sprite);
    setDirFromLocalPoint(p.x, p.y);
  });

  sprite.on('pointermove', onMoveIfActive);

  const end = (e: FederatedPointerEvent) => {
    downs.delete(e.pointerId);

    if (downs.size === 0) {
      // dpad上の指が全て離れたら方向ビット(0..3)を落とす
      currentButtonState &= ~0b1111;
    }
  };

  sprite.on('pointerup', end);
  sprite.on('pointerupoutside', end);
  sprite.on('pointercancel', end);
}

function handleKeyDown(e: KeyboardEvent, directionPad: Sprite, buttons: Sprite[]) {
  if (e.key === "ArrowUp") {
    setButtonStateBit(0, true);
  } else if (e.key === "ArrowDown") {
    setButtonStateBit(1, true);
  } else if (e.key === "ArrowLeft") {
    setButtonStateBit(2, true);
  } else if (e.key === "ArrowRight") {
    setButtonStateBit(3, true);
  } else if (e.key === "z" || e.key === "Z") {
    setButtonStateBit(4, true);
  } else if (e.key === "x" || e.key === "X") {
    setButtonStateBit(5, true);
  } else if (e.key === "a" || e.key === "A") {
    setButtonStateBit(6, true);
  } else if (e.key === "s" || e.key === "S") {
    setButtonStateBit(7, true);
  }
}

function handleKeyUp(e: KeyboardEvent, directionPad: Sprite, buttons: Sprite[]) {
  if (e.key === "ArrowUp") {
    setButtonStateBit(0, false);
  } else if (e.key === "ArrowDown") {
    setButtonStateBit(1, false);
  } else if (e.key === "ArrowLeft") {
    setButtonStateBit(2, false);
  } else if (e.key === "ArrowRight") {
    setButtonStateBit(3, false);
  } else if (e.key === "z" || e.key === "Z") {
    setButtonStateBit(4, false);
  } else if (e.key === "x" || e.key === "X") {
    setButtonStateBit(5, false);
  } else if (e.key === "a" || e.key === "A") {
    setButtonStateBit(6, false);
  } else if (e.key === "s" || e.key === "S") {
    setButtonStateBit(7, false);
  }
}

function updateButtonImages(skin: Skin, directionPad: Sprite, buttons: Sprite[], currentButtonState: number, previousButtonState: number) {
  // ボタン状況に応じて画像を更新する
  if (isChangedButtonState(0)) {
    directionPad.texture = Texture.from(isPressingButton(0) ? skin.key.direction.image.up : skin.key.direction.image.neutral);
  }
  if (isChangedButtonState(1)) {
    directionPad.texture = Texture.from(isPressingButton(1) ? skin.key.direction.image.down : skin.key.direction.image.neutral);
  }
  if (isChangedButtonState(2)) {
    directionPad.texture = Texture.from(isPressingButton(2) ? skin.key.direction.image.left : skin.key.direction.image.neutral);
  }
  if (isChangedButtonState(3)) {
    directionPad.texture = Texture.from(isPressingButton(3) ? skin.key.direction.image.right : skin.key.direction.image.neutral);
  }
  if (isChangedButtonState(4)) {
    const buttonIndex = 0;
    if (buttonIndex < skin.key.buttons.length) {
      buttons[buttonIndex].texture = Texture.from(isPressingButton(4) ? skin.key.buttons[buttonIndex].image.on : skin.key.buttons[buttonIndex].image.off);
    }
  }
  if (isChangedButtonState(5)) {
    const buttonIndex = 1;
    if (buttonIndex < skin.key.buttons.length) {
      buttons[buttonIndex].texture = Texture.from(isPressingButton(5) ? skin.key.buttons[buttonIndex].image.on : skin.key.buttons[buttonIndex].image.off);
    }
  }
  if (isChangedButtonState(6)) {
    const buttonIndex = 2;
    if (buttonIndex < skin.key.buttons.length) {
      buttons[buttonIndex].texture = Texture.from(isPressingButton(6) ? skin.key.buttons[buttonIndex].image.on : skin.key.buttons[buttonIndex].image.off);
    }
  }
  if (isChangedButtonState(7)) {
    const buttonIndex = 3;
    if (buttonIndex < skin.key.buttons.length) {
      buttons[buttonIndex].texture = Texture.from(isPressingButton(7) ? skin.key.buttons[buttonIndex].image.on : skin.key.buttons[buttonIndex].image.off);
    }
  }
}

function updateLayout(app: Application, rootContainer: Container, uiLayer: Container, gameLayer: Container, bgSprite: Sprite, bodySprites: Sprite[], directionPad: Sprite, buttons: Sprite[]) {
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
  updateLayout(app, rootContainer, uiLayer, gameLayer, bgSprite, bodySprites, directionPad, buttons);
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

function handleUpdate(directionPad: Sprite, buttons: Sprite[]) {
  // deltaTime は「前フレーム比の時間倍率」
  // 60FPSで1.0、120FPSで0.5、30FPSで2.0 ぐらいになる
  updateButtonImages(skin, directionPad, buttons, currentButtonState, previousButtonState);
  previousButtonState = currentButtonState;
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
  enableDpadTouch(direction_pad);
  ui_layer.addChild(direction_pad);

  const buttons: Sprite[] = [];

  for (let i = 0; i < 4; ++i) {
    const sprite = new Sprite();
    sprite.anchor.set(0.5);
    sprite.visible = false;
    enableButtonTouch(sprite, i + 4);
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

  // 毎フレーム呼ばれる処理を追加
  app.ticker.add(deltaTime => handleUpdate(direction_pad, buttons));

  updateLayout(app, root_container, ui_layer, game_layer, bg_sprite, body_sprites, direction_pad, buttons);
})();
