import { Circle, Container, FederatedPointerEvent, Sprite, Texture } from "pixi.js";
import { Skin } from "../skin";
import { InputState, PAD_BIT } from "@shared";
import { AppContext, VirtualPadSlots } from "@app/config";

function applyBody(skin: Skin, body: Sprite[]): void {
  // 本体画像は左上、右上、左下、右下に4分割されている
  if (body.length !== 4) {
    throw new Error("invalid body");
  }

  // 本体4分割
  body[0].texture = Texture.from(skin.body.images[0]); body[0].position.set(0, 0);
  body[1].texture = Texture.from(skin.body.images[1]); body[1].position.set(skin.body.size.width / 2, 0);
  body[2].texture = Texture.from(skin.body.images[2]); body[2].position.set(0, skin.body.size.height / 2);
  body[3].texture = Texture.from(skin.body.images[3]); body[3].position.set(skin.body.size.width / 2, skin.body.size.height / 2);
}

function applyDpad(skin: Skin, dpad: Sprite): void {
  dpad.texture = Texture.from(skin.key.direction.image.neutral);
  dpad.position.set(skin.key.direction.position.x, skin.key.direction.position.y);
  dpad.hitArea = new Circle(0, 0, Math.max(dpad.width, dpad.height) * 0.5);
}

function applyButtons(skin: Skin, buttons: Sprite[]): void {
  // ボタン
  buttons.forEach((s, i) => {
    if (skin.key.buttons.length <= i) {
      s.visible = false;
      return;
    }

    const def = skin.key.buttons[i];
    s.visible = true;
    s.texture = Texture.from(def.image.off);
    s.position.set(def.position.x, def.position.y);
  });
}

/**
  * Skin に依存する貼り替えを “だけ” 担当
  */
function applySkin(skin: Skin, slots: VirtualPadSlots): void {
  const { body, dpad, buttons } = slots;

  applyBody(skin, body);        // 本体
  applyDpad(skin, dpad);        // パッド
  applyButtons(skin, buttons);  // ボタン
}

function updateButtonImages(skin: Skin, inputState: InputState, slots: VirtualPadSlots): void {
  const state = inputState;
  const { dpad, buttons } = slots;
  const composed = state.composed();

  // ボタン状況に応じて画像を更新する
  let directionTexImage = skin.key.direction.image.neutral;

  if (composed & (1 << PAD_BIT.DPAD_UP)) {
    directionTexImage = skin.key.direction.image.up;
  }
  else if (composed & (1 << PAD_BIT.DPAD_DOWN)) {
    directionTexImage = skin.key.direction.image.down;
  }
  else if (composed & (1 << PAD_BIT.DPAD_LEFT)) {
    directionTexImage = skin.key.direction.image.left;
  }
  else if (composed & (1 << PAD_BIT.DPAD_RIGHT)) {
    directionTexImage = skin.key.direction.image.right;
  }

  const directionTexture = Texture.from(directionTexImage);
  if (dpad.texture !== directionTexture) {
    dpad.texture = directionTexture;
  }

  // A/B/START/SELECT ボタン
  for (let i = 0; i < 4; ++i) {
    if (skin.key.buttons.length <= i) {
      break;
    }

    const bit = PAD_BIT.BUTTON1 + i;
    buttons[i].texture = Texture.from((composed & (1 << bit)) ? skin.key.buttons[i].image.on : skin.key.buttons[i].image.off);
  }
}

function enableDpadTouch(state: InputState, sprite: Sprite, optionalCallback?: () => void): void {
  sprite.eventMode = "static";
  sprite.cursor = "pointer";

  // 当たり判定を確保
  if (!sprite.hitArea) {
    const r = Math.max(sprite.width, sprite.height) * 0.5;
    sprite.hitArea = new Circle(0, 0, r);
  }

  let activeId: number | null = null; // 採用中の指（1本のみ）

  const setDir = (dx: number, dy: number) => {
    // ローカル座標 (0,0) は中心（anchor=0.5）。dx,dy はそのまま中心からの偏差。
    const dead = Math.min(sprite.width, sprite.height) * 0.08; // デッドゾーン(スプライトの大きさの8%)
    // まず上下左右の入力状況を全クリア
    state.clearTouchDir();

    if (Math.abs(dx) < dead && Math.abs(dy) < dead) {
      // 中央付近ならニュートラルのまま
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      // 左右
      state.setTouch(dx < 0 ? PAD_BIT.DPAD_LEFT : PAD_BIT.DPAD_RIGHT, true);
    } else {
      // 上下
      state.setTouch(dy < 0 ? PAD_BIT.DPAD_UP : PAD_BIT.DPAD_DOWN, true);
    }
  };

  sprite.on("pointerdown", (e: FederatedPointerEvent) => {
    if (activeId !== null) {
      return;     // 2本目以降は無視
    }

    activeId = e.pointerId;
    const p = e.getLocalPosition(sprite);
    setDir(p.x, p.y);
    optionalCallback?.();
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
    // 指が離れたので入力状況を解除
    state.clearTouchDir();
  };

  sprite.on("pointerup", end);
  sprite.on("pointerupoutside", end);
  sprite.on("pointercancel", end);
}

function enableButtonTouch(state: InputState, sprite: Sprite, bit: number, optionalCallback?: () => void): void {
  sprite.eventMode = "static";
  sprite.cursor = "pointer";

  const downs = new Set<number>(); // 押下中の pointerId を保持

  sprite.on("pointerdown", e => {
    downs.add(e.pointerId);
    state.setTouch(bit, true);
    optionalCallback?.();
  });

  const onUp = (e: FederatedPointerEvent) => {
    downs.delete(e.pointerId);

    if (downs.size === 0) {
      state.setTouch(bit, false);
    }
  };

  sprite.on("pointerup", onUp);
  sprite.on("pointerupoutside", onUp);
  sprite.on("pointercancel", onUp);
  sprite.on("pointerleave", onUp);
}

export class VirtualPadUI {
  readonly #app: AppContext;
  readonly #inputState: InputState;
  #skin: Skin;
  #slots!: VirtualPadSlots;

  private constructor(app: AppContext, skin: Skin, inputState: InputState) {
    this.#app = app;
    this.#inputState = inputState;
    this.#skin = skin;
  }

  /**
   * AppContext の上に「バーチャルUI枠」を作って返す
   */
  static attach(app: AppContext, skin: Skin, inputState: InputState): VirtualPadUI {
    const ui = new VirtualPadUI(app, skin, inputState);

    const { frameLayer, overlayLayer } = app;

    // ゲーム機本体の画像(四分割)を作成
    const body: Sprite[] = [];
    for (let i = 0; i < 4; ++i) {
      const s = new Sprite();
      s.anchor.set(0);
      frameLayer.addChild(s);
      body.push(s);
    }

    // 方向キーを作成
    const dpad = Sprite.from(skin.key.direction.image.neutral);
    dpad.anchor.set(0.5);
    overlayLayer.addChild(dpad);

    // その他ボタンを作成
    const buttons: Sprite[] = [];
    for (let i = 0; i < 4; ++i) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      overlayLayer.addChild(sprite);
      buttons.push(sprite);
    }

    ui.#slots = { body, dpad, buttons };

    // 各種ボタンのタッチ判定まわりの設定を行う
    enableDpadTouch(inputState, dpad);
    buttons.forEach((button, i) => enableButtonTouch(inputState, button, PAD_BIT.BUTTON1 + i));

    // 各画像の配置
    ui.applySkin(skin);
    // 表示状態変更/イベント許可設定
    ui.#show();

    return ui;
  }

  detach() {
    const { frameLayer, overlayLayer } = this.#app;

    frameLayer.eventMode = "none";
    frameLayer.visible = false;
    overlayLayer.eventMode = "none";
    overlayLayer.visible = false;
  }

  reattach() {
    this.#show();
  }

  /**
  * ボタン状況に応じて画像を更新する
  *
  * @param skin 各種画像の定義
  * @param state 入力状況
  * @param directionPad 方向キーのスプライト
  * @param buttons ボタン類のスプライト
  */
  updateButtonImages() {
    updateButtonImages(this.#skin, this.#inputState, this.#slots);
  }

  /**
   * Skin に依存する貼り替えを “だけ” 担当
   */
  applySkin(skin: Skin) {
    this.#skin = skin;
    applySkin(skin, this.#slots);
  }

  #show() {
    const { frameLayer, overlayLayer } = this.#app;

    frameLayer.eventMode = "auto";
    frameLayer.visible = true;
    overlayLayer.eventMode = "auto";
    overlayLayer.visible = true;
  }
}

/**
 * ベアモード用の入力UI
 */
export class VirtualPadUIForBare extends Container {
  // 👇 状態定義
  private static readonly State = {
    // 表示状態
    Active: 0,
    // 非表示へ移行中
    FadingOut: 1,
    // 非表示状態
    Hidden: 2,
  } as const;

  #dpad: Sprite;
  #buttons: Sprite[];
  #state: (typeof VirtualPadUIForBare.State)[keyof typeof VirtualPadUIForBare.State] =
    VirtualPadUIForBare.State.Hidden;

  // 自動非表示開始時刻
  #nextHideAt: number | null = null;
  // 自動非表示監視タイマーID
  #watchRafId: number | null = null;
  // UI非表示遷移用タイマーID
  #fadeRafId: number | null = null;

  constructor(inputState: InputState, screenSize: { width: number, height: number }) {
    super();

    this.eventMode = "none";

    // 方向キーを作成
    const dpad = Sprite.from("dir160.png");
    dpad.anchor.set(0.5);
    this.addChild(dpad);

    // その他ボタンを作成
    const buttons: Sprite[] = [];
    for (let i = 0; i < 2; ++i) {
      const sprite = Sprite.from("button80.png");
      sprite.anchor.set(0.5);
      this.addChild(sprite);
      buttons.push(sprite);
    }

    // 各種ボタンのタッチ判定まわりの設定を行う
    enableDpadTouch(inputState, dpad, () => this.#resetHideCounter());
    buttons.forEach((button, i) => enableButtonTouch(inputState, button, PAD_BIT.BUTTON1 + i, () => this.#resetHideCounter()));

    this.#dpad = dpad;
    this.#buttons = buttons;
    this.#resize(screenSize.width, screenSize.height);
    this.show();
  }

  onResize(width: number, height: number): void {
    this.#resize(width, height);
  }

  #resize(width: number, height: number): void {
    // 方向キーは左下へ配置、最低でも画面端から1/10離す、画面サイズ長辺の1/3以下の大きさになるようにする
    const longSide = Math.max(width, height);
    const maximumSize = Math.floor(longSide / 3);
    // 画面サイズの1/3を超える場合はスケーリングでそれ以下の大きさになるように調整する
    const scale = Math.max(this.#dpad.width, this.#dpad.height) < maximumSize ? 1.0 : maximumSize / Math.max(this.#dpad.width, this.#dpad.height);
    const horizontalMargin = Math.floor(width / 15);
    const verticalMargin = Math.floor(height / 15);
    const left = horizontalMargin;
    const right = width - horizontalMargin;
    const bottom = height - verticalMargin;
    console.log({
      horizontalMargin,
      verticalMargin,
      left,
      right,
      bottom,
    });

    this.#dpad.scale.set(scale);
    this.#dpad.position.set(
      // アンカー中央
      left + Math.floor(this.#dpad.width / 2),
      bottom - Math.floor(this.#dpad.height / 2)
    );

    const [ buttonA, buttonB ] = this.#buttons;

    buttonA.scale.set(scale);
    buttonA.position.set(
      // アンカー中央
      Math.floor(right - buttonA.width / 2),
      Math.floor(bottom - buttonB.height - buttonA.height / 2));

    buttonB.scale.set(scale);
    buttonB.position.set(
      Math.floor(right - buttonA.width - buttonA.width / 2 - buttonB.width / 2),
      Math.floor(bottom - buttonB.height / 2));
  }

  // 表示状態変更/イベント許可設定
  show() {
    this.#showNow();
    this.#resetHideCounter();
  }

  hide(durationMS: number = 0) {
    this.#state = 1;
    this.#nextHideAt = null;
    this.#cancelFade();

    if (durationMS === 0) {
      this.#hideNow();
      return;
    }

    const fromAlpha = this.alpha;
    const toAlpha = 0.0;
    let start: number | null = null;

    const step = (now: number): void => {
      if (start === null) { start = now; }
      if (this.#state !== 1) { return; }  // show() で状態が変わっていたら中断

      const t = Math.min((now - start) / durationMS, 1.0);
      this.alpha = fromAlpha + (toAlpha - fromAlpha) * t;

      // フェードみ完了
      if (t < 1.0) {
        this.#fadeRafId = requestAnimationFrame(step);
        return;
      }

      // フェード完了
      this.#hideNow();
      this.#fadeRafId = null;
    };

    this.#fadeRafId = requestAnimationFrame(step);
  }

  #cancelFade(): void {
    if (this.#fadeRafId === null) {
      return;
    }

    cancelAnimationFrame(this.#fadeRafId);
    this.#fadeRafId = null;
  }

  #resetHideCounter(): void {
    this.#showNow();
    // 非表示を5秒後に再スケジューリング
    this.#scheduleAutoHide(5000);
  }

  /**
   * 自動非表示をスケジューリングする
   */
  #scheduleAutoHide(delayMS: number): void {
    this.#nextHideAt = performance.now() + delayMS;

    if (this.#watchRafId !== null) { return; }

    const loop = (now: number) => {
      if (this.#state === VirtualPadUIForBare.State.Active && this.#nextHideAt && this.#nextHideAt <= now) {
        this.hide(1000);
        this.#nextHideAt = null;
      }
      this.#watchRafId = requestAnimationFrame(loop);
    };

    this.#watchRafId = requestAnimationFrame(loop);
  }

  #showNow(): void {
    this.eventMode = "auto";
    this.visible = true;
    this.alpha = 0.5;
    this.#state = VirtualPadUIForBare.State.Active;
  }

  #hideNow(): void {
    this.eventMode = "none";
    this.visible = false;
    this.#state = VirtualPadUIForBare.State.Hidden;
  }
}
