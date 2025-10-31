import { onResize, toggleMode } from "./runtime-actions";
import { RuntimeContext } from "./runtime-context";
import { bindKeyboard, buildAppLayers, createResizeHandler, GameScreenSpec, InputPortAdapter, isUIMode, PixiRenderAdapter, relayoutViewport, relayoutViewportBare, ScreenPortAdapter, ScreenTouchHandler, SkinResolver, ToggleButton, UIMODE, VirtualPadUI, VirtualPadUIForBare, WebAudioAdapter, XorShiftRandomAdapter } from "..";
import { setFirstTouchCallback } from "@core";
import { GameRoot } from "@game";
import { InputState } from "@shared";
import { extensions, ExtensionType } from "pixi.js";
import { loadInitialAssetsAsync } from "./load-initial-assets";

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

export async function setupUi(rc: RuntimeContext): Promise<{ unbindKeyboard: () => void }> {
  // オーディオ周り(Pixi Loader への登録も含む)
  rc.audio = new WebAudioAdapter();
  registerWebAudioLoader((url: string) => rc.audio!.load(url));
  await loadInitialAssetsAsync(rc.audio!);

  // UIモード
  const modeQuery = new URLSearchParams(location.search).get("mode");
  rc.mode = isUIMode(modeQuery) ? modeQuery : UIMODE.PAD;

  // 画面上のUI要素の構築
  rc.gameScreenSpec = new GameScreenSpec();
  rc.inputState = new InputState();
  rc.skins = new SkinResolver(window.innerWidth < window.innerHeight ? "portrait" : "landscape");
  rc.layers = buildAppLayers(rc.app.stage);

  // サウンドのミュートON/OFFボタン
  const soundMuteToggleButton = new ToggleButton({ on: "soundon64.png", off: "soundoff64.png" }, false, () => {
    // Mute/Mute 解除はすぐに反映されないので直前の状態から結果を送る
    rc.audio.setMuted(!rc.audio.isMuted);
    return rc.audio.isMuted;
  });
  rc.layers.appUiLayer.addChild(soundMuteToggleButton);
  soundMuteToggleButton.position.set(soundMuteToggleButton.width / 2, soundMuteToggleButton.height / 2);

  // ベアモードON/OFFボタン
  // TODO: 最初のモードを反映する
  const bareModeToggleButton = new ToggleButton({ on: "fullscreenon64.png", off: "fullscreenoff64.png" }, false, () => toggleMode(rc));
  rc.layers.appUiLayer.addChild(bareModeToggleButton);
  bareModeToggleButton.position.set(soundMuteToggleButton.width + bareModeToggleButton.width / 2 + 24, bareModeToggleButton.height / 2);

  // ポート・ゲーム側システムの作成
  const renderPort = new PixiRenderAdapter(rc.layers.gameLayer);
  const screenPort = new ScreenPortAdapter(rc.gameScreenSpec);
  const inputPort = new InputPortAdapter(rc.inputState);
  const randomPort = XorShiftRandomAdapter.create();  // TODO: セーブデータがある場合はシードを指定する
  // 初回タッチ時にサウンドのサスペンドを解除する設定(ブラウザの場合、タッチイベント契機でないとこの操作ができない)
  setFirstTouchCallback(() => { rc.audio.unlock(); });
  rc.gameRoot = new GameRoot({ render: renderPort, screen: screenPort, input: inputPort, audio: rc.audio, random: randomPort });

  rc.padUI = VirtualPadUI.attach(rc.layers, rc.skins.current, rc.inputState);
  rc.bareUI = new VirtualPadUIForBare(rc.inputState, { width: window.innerWidth, height: window.innerHeight });
  rc.bareUIShower = new ScreenTouchHandler(() => rc.bareUI.show());
  rc.layers.bareUiLayer.addChild(rc.bareUIShower);
  rc.layers.bareUiLayer.addChild(rc.bareUI);

  // 初期レイアウト
  if (rc.mode === UIMODE.PAD) {
    rc.bareUIShower.setEnable(false);
    rc.bareUI.hide();
    relayoutViewport(rc.app, rc.layers, rc.gameScreenSpec, rc.skins.current, window.innerWidth, window.innerHeight);
  }
  else {
    rc.padUI.detach();
    relayoutViewportBare(rc.app, rc.layers, rc.gameScreenSpec, window.innerWidth, window.innerHeight);
  }

  // 画面再構築が必要なイベントを登録
  // 回転・アドレスバー変動・PWA復帰など広めにカバー
  const unbindKeyboard = bindKeyboard(window, rc.inputState);
  const opts = { signal: rc.abortController.signal } as AddEventListenerOptions;
  const handleResize = createResizeHandler(rc.app, rc.layers, rc.gameScreenSpec, rc.skins, () => ({ mode: rc.mode, padUI: rc.padUI, bareUI: rc.bareUI }));
  window.addEventListener("resize", handleResize, opts);
  window.visualViewport?.addEventListener("resize", handleResize, opts);
  window.addEventListener("orientationchange", handleResize, opts);
  window.addEventListener("pageshow", handleResize, opts);

  // // 仮想解像度が変わったら「再構築」（シーン作り直し/タイル再ロード等）
  // gameScreenSpec.addEventListener(VIRTUAL_SCREEN_CHANGE, (_ev: Event) => {
  // }, { signal: ac.signal });

  // 初回再描画
  onResize(rc.app, rc.layers, rc.gameScreenSpec, rc.skins, window.innerWidth, window.innerHeight, { mode: rc.mode, forceApplySkin: true, padUI: rc.padUI, bareUI: rc.bareUI });

  return {
    unbindKeyboard,
  };
}
