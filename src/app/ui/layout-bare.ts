import { Application } from "pixi.js";
import { type UiContext, GameScreenSpec } from "@/app";

export function relayoutViewportBare(app: Application, ctx: UiContext, gameScreenSpec: GameScreenSpec, w: number, h: number, pixelPerfect = false) {
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
  const { width: vw, height: vh } = gameScreenSpec.current;
  const sx = w / vw;
  const sy = h / vh;
  let scale = Math.min(sx, sy);

  if (pixelPerfect) {
    scale = Math.max(1, Math.floor(scale));
  }

  // ゲーム画面を中央へ
  const sw = vw * scale;
  const sh = vh * scale;
  ctx.gameLayer.scale.set(scale);
  ctx.gameLayer.position.set(
    ((w - sw) / 2) | 0,
    ((h - sh) / 2) | 0);

  // 背景を中央に
  ctx.background.position.set(w / 2, h / 2);
}
