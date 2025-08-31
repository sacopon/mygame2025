import { Application, Assets, Circle, Container, FederatedPointerEvent, Graphics, Sprite, Texture } from "pixi.js";
import { skins, Skin, SkinButton } from "@/skin";
import { disableBrowserGestures, registerPwaServiceWorker } from "@/core/browser/browser-utils";
import "@/index.css";

/**
 * リソース読み込み用URLを作成する
 */
const makePath = (path: string) => `${import.meta.env.BASE_URL}${path}`;

// ゲーム画面の内部サイズ
const GAME_SCREEN_WIDTH = 256;
const GAME_SCREEN_HEIGHT = 224;

let currentSkinIndex = -1;

let skin: Skin = skins[0];

let currentButtonState: number = 0;
let currentTouchState: number = 0;

let composedState: number = 0;

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
  direction.hitArea = new Circle(0, 0, Math.max(direction.width, direction.height) * 0.5);

  // その他ボタン
  buttons.forEach(button => button.visible = false);
  skin.key.buttons.forEach((button: SkinButton, i: number) => {
    buttons[i].texture = Texture.from(button.image.off);
    buttons[i].position.set(button.position.x, button.position.y);
    buttons[i].visible = true;
  });
}

function setButtonStateBit(state: number, bit: number, down: boolean): number {
  if (down) {
    return state | (1 << bit);
  }

  return  state & ~(1 << bit);
}

function isPressingButton(bit: number): boolean {
  return (composedState & (1 << bit)) !== 0;
}

function enableButtonTouch(sprite: Sprite, bit: number) {
  sprite.eventMode = "static";
  sprite.cursor = "pointer";

  const downs = new Set<number>(); // 押下中の pointerId を保持

  sprite.on("pointerdown", e => {
    downs.add(e.pointerId);
    currentTouchState = setButtonStateBit(currentTouchState, bit, true);
  });

  const onUp = (e: FederatedPointerEvent) => {
    downs.delete(e.pointerId);

    if (downs.size === 0) {
      currentTouchState = setButtonStateBit(currentTouchState, bit, false);
    }
  };

  sprite.on("pointerup", onUp);
  sprite.on("pointerupoutside", onUp);
  sprite.on("pointercancel", onUp);
  sprite.on("pointerleave", onUp);
}

function enableDpadTouch(sprite: Sprite) {
  sprite.eventMode = "static";
  sprite.cursor = "pointer";

  // 任意：当たり判定をしっかり確保（アンカー中心前提）
  if (!sprite.hitArea) {
    const r = Math.max(sprite.width, sprite.height) * 0.5;
    // 円で十分。十字にしたければ Polygon などで調整
    sprite.hitArea = new Circle(0, 0, r);
  }

  let activeId: number | null = null; // 採用中の指（1本のみ）

  const setDir = (dx: number, dy: number) => {
    // ローカル座標 (0,0) は中心（anchor=0.5）。dx,dy はそのまま中心からの偏差。
    const dead = Math.min(sprite.width, sprite.height) * 0.08; // デッドゾーン(スプライトの大きさの8%)
    // まず上下左右ビット(0..3)を全クリア
    currentTouchState &= ~0b1111;

    if (Math.abs(dx) < dead && Math.abs(dy) < dead) {
      // 中央付近ならニュートラルのまま
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      // 左右
      currentTouchState = setButtonStateBit(currentTouchState, dx < 0 ? 2 : 3, true);  // 左:2, 右:3
    } else {
      // 上下
      currentTouchState = setButtonStateBit(currentTouchState, dy < 0 ? 0 : 1, true);  // 上:0, 下:1
    }
  };

  sprite.on("pointerdown", (e: FederatedPointerEvent) => {
    if (activeId !== null) return;     // 2本目以降は無視
    activeId = e.pointerId;
    const p = e.getLocalPosition(sprite);
    setDir(p.x, p.y);
  });

  sprite.on("pointermove", (e: FederatedPointerEvent) => {
    if (e.pointerId !== activeId) return;
    const p = e.getLocalPosition(sprite);
    setDir(p.x, p.y);
  });

  const end = (e: FederatedPointerEvent) => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    // 指が離れたので方向ビットを落とす
    currentTouchState &= ~0b1111;
  };

  sprite.on("pointerup", end);
  sprite.on("pointerupoutside", end);
  sprite.on("pointercancel", end);
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "ArrowUp") {
    currentButtonState = setButtonStateBit(currentButtonState, 0, true);
  } else if (e.key === "ArrowDown") {
    currentButtonState = setButtonStateBit(currentButtonState, 1, true);
  } else if (e.key === "ArrowLeft") {
    currentButtonState = setButtonStateBit(currentButtonState, 2, true);
  } else if (e.key === "ArrowRight") {
    currentButtonState = setButtonStateBit(currentButtonState, 3, true);
  } else if (e.key === "z" || e.key === "Z") {
    currentButtonState = setButtonStateBit(currentButtonState, 4, true);
  } else if (e.key === "x" || e.key === "X") {
    currentButtonState = setButtonStateBit(currentButtonState, 5, true);
  } else if (e.key === "a" || e.key === "A") {
    currentButtonState = setButtonStateBit(currentButtonState, 6, true);
  } else if (e.key === "s" || e.key === "S") {
    currentButtonState = setButtonStateBit(currentButtonState, 7, true);
  }
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.key === "ArrowUp") {
    currentButtonState = setButtonStateBit(currentButtonState, 0, false);
  } else if (e.key === "ArrowDown") {
    currentButtonState = setButtonStateBit(currentButtonState, 1, false);
  } else if (e.key === "ArrowLeft") {
    currentButtonState = setButtonStateBit(currentButtonState, 2, false);
  } else if (e.key === "ArrowRight") {
    currentButtonState = setButtonStateBit(currentButtonState, 3, false);
  } else if (e.key === "z" || e.key === "Z") {
    currentButtonState = setButtonStateBit(currentButtonState, 4, false);
  } else if (e.key === "x" || e.key === "X") {
    currentButtonState = setButtonStateBit(currentButtonState, 5, false);
  } else if (e.key === "a" || e.key === "A") {
    currentButtonState = setButtonStateBit(currentButtonState, 6, false);
  } else if (e.key === "s" || e.key === "S") {
    currentButtonState = setButtonStateBit(currentButtonState, 7, false);
  }
}

/**
 * ボタン状況に応じて画像を更新する
 *
 * @param skin 各種画像の定義
 * @param directionPad 方向キーのスプライト
 * @param buttons ボタン類のスプライト
 */
function updateButtonImages(skin: Skin, directionPad: Sprite, buttons: Sprite[]) {
  // ボタン状況に応じて画像を更新する

  let directionTexImage = skin.key.direction.image.neutral;

  if (isPressingButton(0)) {
    directionTexImage = skin.key.direction.image.up;
  }
  else if (isPressingButton(1)) {
    directionTexImage = skin.key.direction.image.down;
  }
  else if (isPressingButton(2)) {
    directionTexImage = skin.key.direction.image.left;
  }
  else if (isPressingButton(3)) {
    directionTexImage = skin.key.direction.image.right;
  }

  const directionTexture = Texture.from(directionTexImage);
  if (directionPad.texture !== directionTexture) {
    directionPad.texture = directionTexture;
  }

  // A/B/START/SELECT ボタンは変化時のみ描画
  for (let i = 0; i < 4; ++i) {
    if (skin.key.buttons.length <= i) {
      break;
    }

    const bit = 4 + i;
    buttons[i].texture = Texture.from(isPressingButton(bit) ? skin.key.buttons[i].image.on : skin.key.buttons[i].image.off);
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

    // gameLayer を現在の skin のスクリーン位置・サイズに合わせ直す
    gameLayer.position.set(skin.screen.position.x, skin.screen.position.y);
    gameLayer.scale.set(skin.screen.size.width / GAME_SCREEN_WIDTH);
  }

  // 全体スケーリングとセンタリング
  const scale = Math.min(
    cw / skin.body.size.width,
    ch / skin.body.size.height);
  rootContainer.scale.set(scale);
  rootContainer.position.set((cw / 2) | 0, (ch / 2) | 0);

  // 更新後のレイアウトでボタン類を一度描画する
  updateButtonImages(skin, directionPad, buttons);
}

function handleResize(app: Application, rootContainer: Container, uiLayer: Container, gameLayer: Container, bgSprite: Sprite, bodySprites: Sprite[], directionPad: Sprite, buttons: Sprite[]) {
  updateLayout(app, rootContainer, uiLayer, gameLayer, bgSprite, bodySprites, directionPad, buttons);
}

/**
 * ゲーム仮画面の描画
 *
 * @param gameScreenContainer ゲーム画面用コンテナ 
 */
function drawGameSample(gameScreenContainer: Container) {
  // 赤い四角
  const g1 = new Graphics();
  g1.rect(0, 0, GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT);
  g1.fill({ color: 0xff0000, alpha: 1 });
  gameScreenContainer.addChild(g1);
  // 青い四角
  const g2 = new Graphics();
  g2.rect(0, 0, 16, 16);
  g2.fill({ color: 0x0000ff, alpha: 1 });
  gameScreenContainer.addChild(g2);

  const smile = Sprite.from("smile.png");
  smile.texture.source.scaleMode = "nearest";
  smile.anchor.set(0.5);
  smile.position.set(GAME_SCREEN_WIDTH / 2, GAME_SCREEN_HEIGHT / 2);
  gameScreenContainer.addChild(smile);
}

function handleUpdate(directionPad: Sprite, buttons: Sprite[]) {
  // deltaTime は「前フレーム比の時間倍率」
  // 60FPSで1.0、120FPSで0.5、30FPSで2.0 ぐらいになる
  composedState = currentButtonState | currentTouchState;
  updateButtonImages(skin, directionPad, buttons);
}

function buildUiElement(parent: Container) {
  // コンテナ作成
  const root_container = new Container();
  parent.addChild(root_container);

  // 背景
  const bg_sprite = Sprite.from("screen_bg.png");
  bg_sprite.anchor.set(0.5);
  root_container.addChild(bg_sprite);

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

  return {
    root_container,
    ui_layer,
    game_layer,
    bg_sprite,
    body_sprites,
    direction_pad,
    buttons,
  };
}

function loadAssetsAsync() {
  return Assets.load([
    // 全体背景
    { alias: "screen_bg.png", src: makePath("textures/screen_bg.png") },
    // バーチャルパッドUI
    makePath("textures/virtualui.json"),
    // ゲーム本編系画像(SAMPLE)
    { alias: "smile.png", src: makePath("textures/smile.png") },
  ]);
}

(async () => {
  // PWA の ServiceWorker を設定
  registerPwaServiceWorker(makePath("sw.js"));

  const app = new Application();
  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1099bb,
    roundPixels: true,  // 描画座標に小数値が渡された場合に整数値に丸める
  });
  document.body.appendChild(app.canvas);

  // ブラウザデフォルトのジェスチャ操作を禁止
  disableBrowserGestures(app.canvas);

  // 画像読み込み
  await loadAssetsAsync();

  // 画面上のUI要素の構築
  const {
    root_container,
    ui_layer,
    game_layer,
    bg_sprite,
    body_sprites,
    direction_pad,
    buttons,
  } = buildUiElement(app.stage);

  // ゲーム画面内のサンプル描画
  drawGameSample(game_layer);

  // キーボード入力イベント
  window.addEventListener("keydown", e => {
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) {
      e.preventDefault();
    }

    handleKeyDown(e);
  }, { passive: false });
  window.addEventListener("keyup", e => handleKeyUp(e));

  // 画面再構築が必要なイベントを登録
  // 回転・アドレスバー変動・PWA復帰など広めにカバー
  window.addEventListener("resize", () => handleResize(app, root_container, ui_layer, game_layer, bg_sprite, body_sprites, direction_pad, buttons));
  window.visualViewport?.addEventListener("resize", () => handleResize(app, root_container, ui_layer, game_layer, bg_sprite, body_sprites, direction_pad, buttons));
  window.addEventListener("orientationchange", () => handleResize(app, root_container, ui_layer, game_layer, bg_sprite, body_sprites, direction_pad, buttons));
  window.addEventListener("pageshow", () => handleResize(app, root_container, ui_layer, game_layer, bg_sprite, body_sprites, direction_pad, buttons));

  // 毎フレーム呼ばれる処理を追加
  app.ticker.add((/*deltaTime*/) => handleUpdate(direction_pad, buttons));

  updateLayout(app, root_container, ui_layer, game_layer, bg_sprite, body_sprites, direction_pad, buttons);
})();
