import { Sprite } from "pixi.js";
import { toggleMode } from "./runtime-actions";
import { RuntimeContext } from "./runtime-context";
import { ScreenTouchHandler, ToggleButton, UIMODE, VirtualPadUI, VirtualPadUIForBare } from "../..";
import { getSafeAreaInsets } from "@core/browser/get-safe-area-insets";

export function setupUiLayersAndControls(rc: RuntimeContext): void {
  // 背景作成
  const bg = Sprite.from("screen_bg.png");
  bg.anchor.set(0.5);
  rc.layers.background.addChild(bg);

  const safeAreaInsets = getSafeAreaInsets();

  // サウンドのミュートON/OFFボタン
  const soundMuteToggleButton = new ToggleButton({ on: "soundon64.png", off: "soundoff64.png" }, false, () => {
    // Mute/Mute 解除はすぐに反映されないので直前の状態から結果を送る
    rc.audio.setMuted(!rc.audio.isMuted);
    return rc.audio.isMuted;
  });
  rc.layers.appUiLayer.addChild(soundMuteToggleButton);
  soundMuteToggleButton.position.set(safeAreaInsets.left + soundMuteToggleButton.width / 2, safeAreaInsets.top + soundMuteToggleButton.height / 2);

  // ベアモードON/OFFボタン
  const bareModeToggleButton = new ToggleButton({ on: "fullscreenon64.png", off: "fullscreenoff64.png" }, rc.mode === UIMODE.BARE, () => toggleMode(rc));
  rc.layers.appUiLayer.addChild(bareModeToggleButton);
  bareModeToggleButton.position.set(
    soundMuteToggleButton.x + Math.floor(soundMuteToggleButton.width / 2) + 24 + bareModeToggleButton.width / 2,
    soundMuteToggleButton.y - Math.floor(soundMuteToggleButton.height / 2) + Math.floor(bareModeToggleButton.height / 2));

  rc.padUI = VirtualPadUI.attach(rc.layers, rc.skins.current, rc.inputState);
  rc.bareUI = new VirtualPadUIForBare(rc.inputState, { width: window.innerWidth, height: window.innerHeight });
  rc.bareUIShower = new ScreenTouchHandler(() => rc.bareUI.show());
  rc.layers.bareUiLayer.addChild(rc.bareUIShower);
  rc.layers.bareUiLayer.addChild(rc.bareUI);

  // 初期レイアウト
  if (rc.mode === UIMODE.PAD) {
    rc.bareUIShower.setEnable(false);
    rc.bareUI.hide();
  }
  else {
    rc.padUI.detach();
  }
}
