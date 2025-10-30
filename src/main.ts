import "./index.css";
import { Application, extensions, ExtensionType } from "pixi.js";

import {
  disableBrowserGestures,
  makePath,
  registerPwaServiceWorker,
} from "@core";

import {
  isUIMode,
  loadInitialAssetsAsync,
  setUpUiAndResize,
  UIMODE,
  WebAudioAdapter,
} from "@app";

import { setUpGameLoop } from "@app/bootstrap/setup-game-loop";
import { RuntimeContext } from "@app/bootstrap/runtime-context";

function registerWebAudioLoader(loaderFunc: (url: string) => Promise<AudioBuffer>): void {
  extensions.add({
    name: "web-audio-loader",
    extension: ExtensionType.LoadParser,
    test: (url: string, options: { format?: string }) => {
      const audioExtensions = ["mp3", "ogg", "wav"];
      const ext = options.format ?? (url.split("?")[0].split(".").pop() ?? "").toLowerCase();
      return audioExtensions.includes(ext);
    },
    load: loaderFunc,
    unload: async (_buffer: AudioBuffer) => { /* 特になし */ },
  });
}

(async () => {
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
  // オーディオ周り(Pixi Loader への登録も含む)
  rc.audio = new WebAudioAdapter();
  registerWebAudioLoader((url: string) => rc.audio!.load(url));
  await loadInitialAssetsAsync(rc.audio!);
  // UIモード/レイアウト系初期化
  const modeQuery = new URLSearchParams(location.search).get("mode");
  rc.mode = isUIMode(modeQuery) ? modeQuery : UIMODE.PAD;
  const { unbindKeyboard } = setUpUiAndResize(rc);
  // ゲームループ ＆ 終了処理の登録
  setUpGameLoop(rc, unbindKeyboard);
})();
