import { bindKeyboard, buildAppContext, createResizeHandler, GameScreenSpec, InputPortAdapter, onResize, PixiRenderAdapter, relayoutViewport, relayoutViewportBare, ScreenPortAdapter, ScreenTouchHandler, SkinResolver, ToggleButton, UIMODE, VirtualPadUI, VirtualPadUIForBare, XorShiftRandomAdapter } from "..";
import { setFirstTouchCallback } from "@core";
import { GameRoot } from "@game";
import { InputState } from "@shared";
import { RuntimeContext } from "./runtime-context";

export function toggleMode(rc: RuntimeContext): void {
  if (rc.mode === UIMODE.PAD) {
    rc.padUI.detach();
    rc.bareUI.onResize(window.innerWidth, window.innerHeight);
    rc.bareUI.show();
    rc.bareUIShower.setEnable(true);
    rc.mode = UIMODE.BARE;
  }
  else {
    rc.bareUI.hide();
    rc.bareUIShower.setEnable(false);

    if (!rc.padUI) {
      rc.padUI = VirtualPadUI.attach(rc.pixiLayers, rc.skins.current, rc.inputState);
    } else {
      rc.padUI.reattach();
    }

    rc.mode = UIMODE.PAD;
  }

  onResize(rc.app, rc.pixiLayers, rc.gameScreenSpec, rc.skins, window.innerWidth, window.innerHeight, { mode: rc.mode, forceApplySkin: true, padUI: rc.padUI, bareUI: rc.bareUI });
}

export function setUpUiAndResize(rc: RuntimeContext): { unbindKeyboard: () => void } {
  // 画面上のUI要素の構築
  rc.gameScreenSpec = new GameScreenSpec();
  rc.inputState = new InputState();
  rc.skins = new SkinResolver(window.innerWidth < window.innerHeight ? "portrait" : "landscape");
  rc.pixiLayers = buildAppContext(rc.app.stage);

  // サウンドのミュートON/OFFボタン
  const soundMuteToggleButton = new ToggleButton({ on: "soundon64.png", off: "soundoff64.png" }, false, () => {
    // Mute/Mute 解除はすぐに反映されないので直前の状態から結果を送る
    rc.audio.setMuted(!rc.audio.isMuted);
    return rc.audio.isMuted;
  });
  rc.pixiLayers.appUiLayer.addChild(soundMuteToggleButton);
  soundMuteToggleButton.position.set(soundMuteToggleButton.width / 2, soundMuteToggleButton.height / 2);

  // ベアモードON/OFFボタン
  const bareModeToggleButton = new ToggleButton({ on: "fullscreenon64.png", off: "fullscreenoff64.png" }, false, () => toggleMode(rc));
  rc.pixiLayers.appUiLayer.addChild(bareModeToggleButton);
  bareModeToggleButton.position.set(soundMuteToggleButton.width + bareModeToggleButton.width / 2 + 24, bareModeToggleButton.height / 2);

  // ポート・ゲーム側システムの作成
  const renderPort = new PixiRenderAdapter(rc.pixiLayers.gameLayer);
  const screenPort = new ScreenPortAdapter(rc.gameScreenSpec);
  const inputPort = new InputPortAdapter(rc.inputState);
  const randomPort = XorShiftRandomAdapter.create();  // TODO: セーブデータがある場合はシードを指定する
  // 初回タッチ時にサウンドのサスペンドを解除する設定(ブラウザの場合、タッチイベント契機でないとこの操作ができない)
  setFirstTouchCallback(() => { rc.audio.unlock(); });
  rc.gameRoot = new GameRoot({ render: renderPort, screen: screenPort, input: inputPort, audio: rc.audio, random: randomPort });

  rc.padUI = VirtualPadUI.attach(rc.pixiLayers, rc.skins.current, rc.inputState);
  rc.bareUI = new VirtualPadUIForBare(rc.inputState, { width: window.innerWidth, height: window.innerHeight });
  rc.bareUIShower = new ScreenTouchHandler(() => rc.bareUI.show());
  rc.pixiLayers.bareUiLayer.addChild(rc.bareUIShower);
  rc.pixiLayers.bareUiLayer.addChild(rc.bareUI);

  // 初期レイアウト
  if (rc.mode === UIMODE.PAD) {
    rc.bareUIShower.setEnable(false);
    rc.bareUI.hide();
    relayoutViewport(rc.app, rc.pixiLayers, rc.gameScreenSpec, rc.skins.current, window.innerWidth, window.innerHeight);
  }
  else {
    rc.padUI.detach();
    relayoutViewportBare(rc.app, rc.pixiLayers, rc.gameScreenSpec, window.innerWidth, window.innerHeight);
  }

  // キーボード入力イベント
  /**
   * 登録したキーボードイベントリスナをすべて解除する。
   * AbortController.abort() から呼ばれる。
   */
  const unbindKeyboard = bindKeyboard(window, rc.inputState);

  // 画面再構築が必要なイベントを登録
  // 回転・アドレスバー変動・PWA復帰など広めにカバー
  const opts = { signal: rc.abortController.signal } as AddEventListenerOptions;
  const handleResize = createResizeHandler(rc.app, rc.pixiLayers, rc.gameScreenSpec, rc.skins, () => ({ mode: rc.mode, padUI: rc.padUI, bareUI: rc.bareUI }));
  window.addEventListener("resize", handleResize, opts);
  window.visualViewport?.addEventListener("resize", handleResize, opts);
  window.addEventListener("orientationchange", handleResize, opts);
  window.addEventListener("pageshow", handleResize, opts);

  // // 仮想解像度が変わったら「再構築」（シーン作り直し/タイル再ロード等）
  // gameScreenSpec.addEventListener(VIRTUAL_SCREEN_CHANGE, (_ev: Event) => {
  // }, { signal: ac.signal });

  // 初回再描画
  onResize(rc.app, rc.pixiLayers, rc.gameScreenSpec, rc.skins, window.innerWidth, window.innerHeight, { mode: rc.mode, forceApplySkin: true, padUI: rc.padUI, bareUI: rc.bareUI });

  return { unbindKeyboard };
}
