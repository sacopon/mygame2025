import { Circle, Container, FederatedPointerEvent, Sprite } from "pixi.js";
import { GAME_SCREEN, PAD_BIT, type UiContext } from "@/app";
import { Skin } from "@/skin";
import { InputState } from "@/app/input/input-state";

export function enableDpadTouch(state: InputState, sprite: Sprite) {
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

export function enableButtonTouch(state: InputState, sprite: Sprite, bit: number) {
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

export function buildUiContext(parent: Container, skin: Skin, inputState: InputState): UiContext {
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

  // UI レイヤー
  const uiLayer = new Container();
  deviceLayer.addChild(uiLayer);

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
  enableDpadTouch(inputState, dpad);
  uiLayer.addChild(dpad);

  const buttons: Sprite[] = [];

  for (let i = 0; i < 4; ++i) {
    const sprite = new Sprite();
    sprite.anchor.set(0.5);
    sprite.visible = false;
    enableButtonTouch(inputState, sprite, i + 4);
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
  deviceLayer.addChild(gameLayer);

  return {
    root,
    deviceLayer,
    uiLayer,
    gameLayer,
    background,
    body,
    dpad,
    buttons,
  };
}
