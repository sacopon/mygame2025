import { Circle, FederatedPointerEvent, Sprite, Texture } from "pixi.js";
import { Skin } from "../skin";
import { InputState, PAD_BIT } from "@shared";
import { AppContext, VirtualPadSlots } from "@app/config";

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
    ui.enableDpadTouch(inputState, dpad);
    buttons.forEach((button, i) => ui.enableButtonTouch(inputState, button, PAD_BIT.BUTTON1 + i));

    // 各画像の配置
    ui.applySkin(skin);
    // 表示状態変更/イベント許可設定
    ui.show();

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
    this.show();
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
    const skin = this.#skin;
    const state = this.#inputState;
    const { dpad, buttons } = this.#slots;
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

  /**
   * Skin に依存する貼り替えを “だけ” 担当
   */
  applySkin(skin: Skin) {
    this.#skin = skin;
    const { body, dpad, buttons } = this.#slots;

    // 本体4分割
    body[0].texture = Texture.from(skin.body.images[0]); body[0].position.set(0, 0);
    body[1].texture = Texture.from(skin.body.images[1]); body[1].position.set(skin.body.size.width / 2, 0);
    body[2].texture = Texture.from(skin.body.images[2]); body[2].position.set(0, skin.body.size.height / 2);
    body[3].texture = Texture.from(skin.body.images[3]); body[3].position.set(skin.body.size.width / 2, skin.body.size.height / 2);

    // D-Pad
    dpad.texture = Texture.from(skin.key.direction.image.neutral);
    dpad.position.set(skin.key.direction.position.x, skin.key.direction.position.y);
    dpad.hitArea = new Circle(0, 0, Math.max(dpad.width, dpad.height) * 0.5);

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

  private show() {
    const { frameLayer, overlayLayer } = this.#app;

    frameLayer.eventMode = "auto";
    frameLayer.visible = true;
    overlayLayer.eventMode = "auto";
    overlayLayer.visible = true;
  }

  private enableDpadTouch(state: InputState, sprite: Sprite) {
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

  private enableButtonTouch(state: InputState, sprite: Sprite, bit: number) {
    sprite.eventMode = "static";
    sprite.cursor = "pointer";

    const downs = new Set<number>(); // 押下中の pointerId を保持

    sprite.on("pointerdown", e => {
      downs.add(e.pointerId);
      state.setTouch(bit, true);
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
}
