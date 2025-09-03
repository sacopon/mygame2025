import { Circle, Texture } from "pixi.js";
import { GAME_SCREEN, type UiContext } from "@/app";
import type { Skin } from "@/skin";

/** Skin に依存する貼り替えを “だけ” 担当 */
export function applySkin(ctx: UiContext, skin: Skin) {
  // 本体4分割
  ctx.body[0].texture = Texture.from(skin.body.images[0]); ctx.body[0].position.set(0, 0);
  ctx.body[1].texture = Texture.from(skin.body.images[1]); ctx.body[1].position.set(skin.body.size.width / 2, 0);
  ctx.body[2].texture = Texture.from(skin.body.images[2]); ctx.body[2].position.set(0, skin.body.size.height / 2);
  ctx.body[3].texture = Texture.from(skin.body.images[3]); ctx.body[3].position.set(skin.body.size.width / 2, skin.body.size.height / 2);

  // D-Pad
  ctx.dpad.texture = Texture.from(skin.key.direction.image.neutral);
  ctx.dpad.position.set(skin.key.direction.position.x, skin.key.direction.position.y);
  ctx.dpad.hitArea = new Circle(0, 0, Math.max(ctx.dpad.width, ctx.dpad.height) * 0.5);

  // ボタン
  ctx.buttons.forEach((s, i) => {
    if (skin.key.buttons.length <= i) {
      s.visible = false;
      return;
    }

    const def = skin.key.buttons[i];
    s.visible = true;
    s.texture = Texture.from(def.image.off);
    s.position.set(def.position.x, def.position.y);
  });

  // ゲーム画面（Skin 依存）
  ctx.gameLayer.position.set(skin.screen.position.x, skin.screen.position.y);
  ctx.gameLayer.scale.set(skin.screen.size.width / GAME_SCREEN.WIDTH);
}
