import { Application, Assets, Circle, Container, FederatedPointerEvent, Graphics, Sprite, Texture } from "pixi.js";
import { skins, Skin, SkinButton } from "@/skin";
import { disableBrowserGestures, registerPwaServiceWorker } from "@/core/browser/browser-utils";
import "@/index.css";
import { GAME_SCREEN, PAD_BIT } from "@/app/constants";
import { UiContext } from "@/app/types";

/**
 * リソース読み込み用URLを作成する
 */
const makePath = (path: string) => `${import.meta.env.BASE_URL}${path}`;

let currentSkinIndex = -1;

let skin: Skin = skins[0];

let currentButtonState: number = 0;
let currentTouchState: number = 0;

let composedState: number = 0;

function buildVirtualConsoleUi(skin: Skin, context: UiContext) {
  // ゲーム機本体
  context.body[0].texture = Texture.from(skin.body.images[0]);
  context.body[0].position.set(0, 0);
  context.body[1].texture = Texture.from(skin.body.images[1]);
  context.body[1].position.set(skin.body.size.width  / 2, 0);
  context.body[2].texture = Texture.from(skin.body.images[2]);
  context.body[2].position.set(0, skin.body.size.height / 2);
  context.body[3].texture = Texture.from(skin.body.images[3]);
  context.body[3].position.set(skin.body.size.width  / 2, skin.body.size.height / 2);

  // 方向キー
  context.dpad.texture = Texture.from(skin.key.direction.image.neutral);
  context.dpad.position.set(
    skin.key.direction.position.x,
    skin.key.direction.position.y);
  context.dpad.hitArea = new Circle(0, 0, Math.max(context.dpad.width, context.dpad.height) * 0.5);

  // その他ボタン
  context.buttons.forEach(button => button.visible = false);
  skin.key.buttons.forEach((button: SkinButton, i: number) => {
    context.buttons[i].texture = Texture.from(button.image.off);
    context.buttons[i].position.set(button.position.x, button.position.y);
    context.buttons[i].visible = true;
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
      currentTouchState = setButtonStateBit(currentTouchState, dx < 0 ? PAD_BIT.DPAD_LEFT : PAD_BIT.DPAD_RIGHT, true);
    } else {
      // 上下
      currentTouchState = setButtonStateBit(currentTouchState, dy < 0 ? PAD_BIT.DPAD_UP : PAD_BIT.DPAD_DOWN, true);
    }
  };

  sprite.on("pointerdown", (e: FederatedPointerEvent) => {
    if (activeId !== null) {
      return;     // 2本目以降は無視
    }

    activeId = e.pointerId;
    const p = e.getLocalPosition(sprite);
    setDir(p.x, p.y);
  });

  sprite.on("pointermove", (e: FederatedPointerEvent) => {
    if (e.pointerId !== activeId) {
      return;
    }

    const p = e.getLocalPosition(sprite);
    setDir(p.x, p.y);
  });

  const end = (e: FederatedPointerEvent) => {
    if (e.pointerId !== activeId) {
      return;
    }

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
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.DPAD_UP, true);
  } else if (e.key === "ArrowDown") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.DPAD_DOWN, true);
  } else if (e.key === "ArrowLeft") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.DPAD_LEFT, true);
  } else if (e.key === "ArrowRight") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.DPAD_RIGHT, true);
  } else if (e.key === "z" || e.key === "Z") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.BUTTON1, true);
  } else if (e.key === "x" || e.key === "X") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.BUTTON2, true);
  } else if (e.key === "a" || e.key === "A") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.BUTTON3, true);
  } else if (e.key === "s" || e.key === "S") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.BUTTON4, true);
  }
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.key === "ArrowUp") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.DPAD_UP, false);
  } else if (e.key === "ArrowDown") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.DPAD_DOWN, false);
  } else if (e.key === "ArrowLeft") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.DPAD_LEFT, false);
  } else if (e.key === "ArrowRight") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.DPAD_RIGHT, false);
  } else if (e.key === "z" || e.key === "Z") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.BUTTON1, false);
  } else if (e.key === "x" || e.key === "X") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.BUTTON2, false);
  } else if (e.key === "a" || e.key === "A") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.BUTTON3, false);
  } else if (e.key === "s" || e.key === "S") {
    currentButtonState = setButtonStateBit(currentButtonState, PAD_BIT.BUTTON4, false);
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

  if (isPressingButton(PAD_BIT.DPAD_UP)) {
    directionTexImage = skin.key.direction.image.up;
  }
  else if (isPressingButton(PAD_BIT.DPAD_DOWN)) {
    directionTexImage = skin.key.direction.image.down;
  }
  else if (isPressingButton(PAD_BIT.DPAD_LEFT)) {
    directionTexImage = skin.key.direction.image.left;
  }
  else if (isPressingButton(PAD_BIT.DPAD_RIGHT)) {
    directionTexImage = skin.key.direction.image.right;
  }

  const directionTexture = Texture.from(directionTexImage);
  if (directionPad.texture !== directionTexture) {
    directionPad.texture = directionTexture;
  }

  // A/B/START/SELECT ボタン
  for (let i = 0; i < 4; ++i) {
    if (skin.key.buttons.length <= i) {
      break;
    }

    const bit = PAD_BIT.BUTTON1 + i;
    buttons[i].texture = Texture.from(isPressingButton(bit) ? skin.key.buttons[i].image.on : skin.key.buttons[i].image.off);
  }
}

function updateLayout(app: Application, context: UiContext) {
  // pixi.js による描画領域を再設定
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  app.renderer.resize(cw, ch);

  const nextSkinIndex = cw < ch ? 0 : 1;

  if (currentSkinIndex != nextSkinIndex) {
    skin = skins[nextSkinIndex];
    currentSkinIndex = nextSkinIndex;

    // 背景を画面中央に
    context.background.position.set(cw / 2, ch / 2);

    // UIレイヤーの pivot を本体画像のサイズに合わせて再設定
    context.uiLayer.pivot.set(
      skin.body.size.width  / 2,
      skin.body.size.height / 2
    );

    // UI を再配置
    buildVirtualConsoleUi(skin, context);

    // gameLayer を現在の skin のスクリーン位置・サイズに合わせ直す
    context.gameLayer.position.set(skin.screen.position.x, skin.screen.position.y);
    context.gameLayer.scale.set(skin.screen.size.width / GAME_SCREEN.WIDTH);
  }

  // 全体スケーリングとセンタリング
  const scale = Math.min(
    cw / skin.body.size.width,
    ch / skin.body.size.height);
  context.root.scale.set(scale);
  context.root.position.set((cw / 2) | 0, (ch / 2) | 0);

  // 更新後のレイアウトでボタン類を一度描画する
  updateButtonImages(skin, context.dpad, context.buttons);
}

function handleResize(app: Application, context: UiContext) {
  updateLayout(app, context);
}

/**
 * ゲーム仮画面の描画
 *
 * @param gameScreenContainer ゲーム画面用コンテナ 
 */
function drawGameSample(gameScreenContainer: Container) {
  // 赤い四角
  const g1 = new Graphics();
  g1.rect(0, 0, GAME_SCREEN.WIDTH, GAME_SCREEN.HEIGHT);
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
  smile.position.set(GAME_SCREEN.WIDTH / 2, GAME_SCREEN.HEIGHT / 2);
  gameScreenContainer.addChild(smile);
}

function handleUpdate(directionPad: Sprite, buttons: Sprite[]) {
  // deltaTime は「前フレーム比の時間倍率」
  // 60FPSで1.0、120FPSで0.5、30FPSで2.0 ぐらいになる
  composedState = currentButtonState | currentTouchState;
  updateButtonImages(skin, directionPad, buttons);
}

function buildUiContext(parent: Container): UiContext {
  // コンテナ作成
  const root = new Container();
  parent.addChild(root);

  // 背景
  const background = Sprite.from("screen_bg.png");
  background.anchor.set(0.5);
  root.addChild(background);

  // UI レイヤー
  const uiLayer = new Container();
  root.addChild(uiLayer);

  uiLayer.pivot.set(
    skin.body.size.width  / 2,
    skin.body.size.height / 2);

  // ゲーム機本体(UIレイヤー)
  const body: Sprite[] = [];
  for (let i = 0; i < 4; ++i) {
    const s = new Sprite();
    s.anchor.set(0);
    uiLayer.addChild(s);
    body.push(s);
  }

  // 方向キー(UIレイヤー)
  const dpad = Sprite.from(skin.key.direction.image.neutral);
  dpad.anchor.set(0.5);
  enableDpadTouch(dpad);
  uiLayer.addChild(dpad);

  const buttons: Sprite[] = [];

  for (let i = 0; i < 4; ++i) {
    const sprite = new Sprite();
    sprite.anchor.set(0.5);
    sprite.visible = false;
    enableButtonTouch(sprite, i + 4);
    uiLayer.addChild(sprite);
    buttons.push(sprite);
  }

  // ゲーム画面レイヤー
  const gameLayer = new Container();
  gameLayer.position.set(
    skin.screen.position.x,
    skin.screen.position.y);
  gameLayer.pivot.set(0, 0);
  gameLayer.scale.set(skin.screen.size.width / GAME_SCREEN.WIDTH);
  uiLayer.addChild(gameLayer);

  return {
    root,
    uiLayer,
    gameLayer,
    background,
    body,
    dpad,
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
  const context = buildUiContext(app.stage);

  // ゲーム画面内のサンプル描画
  drawGameSample(context.gameLayer);

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
  window.addEventListener("resize", () => handleResize(app, context));
  window.visualViewport?.addEventListener("resize", () => handleResize(app, context));
  window.addEventListener("orientationchange", () => handleResize(app, context));
  window.addEventListener("pageshow", () => handleResize(app, context));

  // 毎フレーム呼ばれる処理を追加
  app.ticker.add((/*deltaTime*/) => handleUpdate(context.dpad, context.buttons));

  updateLayout(app, context);
})();
