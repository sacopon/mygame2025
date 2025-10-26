import { Application, Container, Sprite } from "pixi.js";
import { Skin } from "../";
import { AppContext } from "@app/config";
import { GameScreenSpec } from "@app/services";

// TODO: 適切な場所へ移動する
function createVirtualPadUiForBare(parent: Container, vw: number, vh: number, width: number, height: number): void {
  parent.children.forEach(c => {
    c.removeFromParent();
    c.destroy({ children: true });
  });

  console.log([vw, vh, width, height]);
  const container = new Container();
  const dir = Sprite.from("dir128.png");

  container.addChild(dir);

  dir.position.set(0, vh - dir.height);
  parent.addChild(container);

  // 方向キーは左下へ配置、最低でも画面端から1/10離す、画面サイズ長辺の1/3以下の大きさになるようにする
  const longSide = Math.max(width, height);
  const maximumSize = Math.floor(longSide / 3);
  if (maximumSize < Math.max(dir.width, dir.height)) {
    // 画面サイズの1/3を超える場合はスケーリングでそれ以下の大きさになるように調整する
    dir.scale.set(maximumSize / Math.max(dir.width, dir.height));
  }

  const x = Math.floor(width / 10);
  const y = height - dir.height - Math.floor(height / 10);
  dir.position.set(x, y);
  alert("test");
}

export function relayoutViewport(app: Application, ctx: AppContext, gameScreenSpec: GameScreenSpec, skin: Skin, w: number, h: number) {
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

export function relayoutViewportBare(app: Application, ctx: AppContext, gameScreenSpec: GameScreenSpec, w: number, h: number, pixelPerfect = false) {
  const cw = (app.renderer.canvas as HTMLCanvasElement).width;
  const ch = (app.renderer.canvas as HTMLCanvasElement).height;

  if (cw !== w || ch !== h) {
    app.renderer.resize(w, h);
  }

  // 中央寄せ・スケール(バーチャルパッドUIなし)
  ctx.deviceLayer.pivot.set(0, 0);
  ctx.deviceLayer.scale.set(1);
  ctx.deviceLayer.position.set(0, 0);

  const { width: vw, height: vh } = gameScreenSpec.current;
  const viewAspect = w / h;
  const CAP_ASPECT = 16 / 9; // 上限とするアスペクト（これ以上横長は左右余白＝pillarbox）

  // 16:9 までは「幅フィット」＝上下見切れ
  // それ以上の横長は「高さフィット」＝左右余白
  let scale: number = 0;

  if (viewAspect <= CAP_ASPECT) {
    scale = w / vw; // 幅フィット
  } else {
    // 高さに合わせた “16:9 の表示幅” を基準に、常に同じトリム量に固定
    const displayWidthAtCap = h * CAP_ASPECT;     // ここが 16:9 の表示箱の横幅
    scale = displayWidthAtCap / vw;               // ← これで 16:9 位置でのスケールを維持
    // 同値式: scale = (h / vh) * (CAP_ASPECT / (vw/vh))
  }

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

  // 仮UIを表示
  createVirtualPadUiForBare(ctx.appUiLayer, vw, vh, w, h);
}
