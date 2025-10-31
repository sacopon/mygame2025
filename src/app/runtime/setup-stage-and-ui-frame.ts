import { RuntimeContext } from "./runtime-context";
import { buildAppLayers, GameScreenSpec, SkinResolver } from "..";
import { InputState } from "@shared";

export function setupStageAndUiFrame(rc: RuntimeContext): void {
  // 画面上のUI要素の構築
  rc.gameScreenSpec = new GameScreenSpec();
  rc.inputState = new InputState();
  rc.skins = new SkinResolver(window.innerWidth < window.innerHeight ? "portrait" : "landscape");
  rc.layers = buildAppLayers(rc.app.stage);
}
