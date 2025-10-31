import { disableBrowserGestures, makePath, registerPwaServiceWorker } from "@core";
import { RuntimeContext, setupUi, startGameLoop } from "..";
import { Application } from "pixi.js";

export async function startApp(): Promise<void> {
  // 共通ランタイムコンテナを用意
  const rc = {} as RuntimeContext;
  rc.abortController = new AbortController();

  // PWA 系初期化
  registerPwaServiceWorker(makePath("sw.js"));

  // Pixi.js 初期化
  rc.app = new Application();
  await rc.app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1099bb,
    roundPixels: true,  // 描画座標に小数値が渡された場合に整数値に丸める
  });
  document.body.appendChild(rc.app.canvas);
  disableBrowserGestures(rc.app.canvas);

  // UI構築、各種アダプター、GameRoot 生成など
  const { unbindKeyboard } = await setupUi(rc);

  // ゲームループ開始
  startGameLoop(rc, unbindKeyboard);
}
