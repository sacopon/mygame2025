import { Sprite } from "pixi.js";
import { toggleMode } from "./runtime-actions";
import { RuntimeContext } from "./runtime-context";
import { ScreenTouchHandler, ToggleButton, UIMODE, VirtualPadUI, VirtualPadUIForBare } from "../..";
import { BuildVersionText } from "@app/features/ui/elements/build-version-text";

export function setupUiLayersAndControls(rc: RuntimeContext): void {
  // 背景作成
  const bg = Sprite.from("screen_bg.png");
  bg.anchor.set(0.5);
  rc.layers.background.addChild(bg);

  // サウンドのミュートON/OFFボタン
  rc.muteButton = new ToggleButton({ on: "soundon64.png", off: "soundoff64.png" }, false, () => {
    // Mute/Mute 解除はすぐに反映されないので直前の状態から結果を送る
    rc.audio.setMuted(!rc.audio.isMuted);
    return rc.audio.isMuted;
  });
  rc.layers.appUiLayer.addChild(rc.muteButton);

  // ベアモードON/OFFボタン
  rc.bareButton = new ToggleButton({ on: "fullscreenon64.png", off: "fullscreenoff64.png" }, rc.mode === UIMODE.BARE, () => toggleMode(rc));
  rc.layers.appUiLayer.addChild(rc.bareButton);

  rc.padUI = VirtualPadUI.attach(rc.layers, rc.skins.current, rc.inputState);
  rc.bareUI = new VirtualPadUIForBare(rc.inputState, { width: window.innerWidth, height: window.innerHeight });
  rc.bareUIShower = new ScreenTouchHandler(() => rc.bareUI.show());
  rc.layers.bareUiLayer.addChild(rc.bareUIShower);
  rc.layers.bareUiLayer.addChild(rc.bareUI);

  // ビルドバージョン表示
  rc.buildVersion = new BuildVersionText();
  rc.layers.appUiLayer.addChild(rc.buildVersion);

  // 初期レイアウト
  if (rc.mode === UIMODE.PAD) {
    rc.bareUIShower.setEnable(false);
    rc.bareUI.hide();
  }
  else {
    rc.padUI.detach();
  }
}
