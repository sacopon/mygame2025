import { Application } from "pixi.js";
import { UiContext } from "@/app/types";
import { GAME_SCREEN } from "@/app/constants";

export function relayoutViewportBare(app: Application, ctx: UiContext, w: number, h: number, pixelPerfect = false) {
  const cw = (app.renderer.canvas as HTMLCanvasElement).width;
  const ch = (app.renderer.canvas as HTMLCanvasElement).height;

  if (cw !== w || ch !== h) {
    app.renderer.resize(w, h);
  }

  // 中央寄せ・スケール(バーチャルパッドUIなし)
  ctx.deviceLayer.pivot.set(0, 0);
  ctx.deviceLayer.scale.set(1);
  ctx.deviceLayer.position.set(0, 0);

  // 短辺フィットにスケーリング
  const sx = w / GAME_SCREEN.WIDTH;
  const sy = h / GAME_SCREEN.HEIGHT;
  let scale = Math.min(sx, sy);

  if (pixelPerfect) {
    scale = Math.max(1, Math.floor(scale));
  }

  // ゲーム画面を中央へ
  const screenWidth = GAME_SCREEN.WIDTH * scale;
  const screenHeight = GAME_SCREEN.HEIGHT * scale;
  ctx.gameLayer.scale.set(scale);
  ctx.gameLayer.position.set(
    ((w - screenWidth)  / 2) | 0,
    ((h - screenHeight) / 2) | 0);

  // 背景を中央に
  ctx.background.position.set(w / 2, h / 2);
}
