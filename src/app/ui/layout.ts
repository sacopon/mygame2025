import { Texture, Sprite, Application } from "pixi.js";
import { PAD_BIT, type UiContext } from "@/app";
import { Skin } from "@/skin";
import { InputState } from "@/app/input/input-state";
import { GameScreenSpec } from "../screen/screen-spec";

/**
 * ボタン状況に応じて画像を更新する
 *
 * @param skin 各種画像の定義
 * @param state 入力状況
 * @param directionPad 方向キーのスプライト
 * @param buttons ボタン類のスプライト
 */
export function updateButtonImages(skin: Skin, state: InputState, directionPad: Sprite, buttons: Sprite[]) {
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
  if (directionPad.texture !== directionTexture) {
    directionPad.texture = directionTexture;
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

export function relayoutViewport(app: Application, ctx: UiContext, gameScreenSpec: GameScreenSpec, skin: Skin, w: number, h: number) {
  const cw = (app.renderer.canvas as HTMLCanvasElement).width;
  const ch = (app.renderer.canvas as HTMLCanvasElement).height;

  if (cw !== w || ch !== h) {
    app.renderer.resize(w, h);
  }

  // 中央寄せ・スケール
  ctx.deviceLayer.pivot.set(skin.body.size.width / 2, skin.body.size.height / 2);
  const scale = Math.min(w / skin.body.size.width, h / skin.body.size.height);
  ctx.deviceLayer.scale.set(scale);
  ctx.deviceLayer.position.set((w / 2) | 0, (h / 2) | 0);

  // ゲーム画面は端末ボディ座標系で設定
  ctx.gameLayer.position.set(skin.screen.position.x, skin.screen.position.y);
  ctx.gameLayer.scale.set(skin.screen.size.width / gameScreenSpec.current.width);

  // 背景を中央に
  ctx.background.position.set(w / 2, h / 2);
}
