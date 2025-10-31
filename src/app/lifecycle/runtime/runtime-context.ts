import { WebAudioAdapter } from "@app/adapters";
import { AppLayers } from "@app/config";
import { ScreenTouchHandler, SkinResolver, UIMode, VirtualPadUI, VirtualPadUIForBare } from "@app/features";
import { GameScreenSpec } from "@app/services";
import { GameRoot } from "@game/presentation";
import { InputState } from "@shared/input";
import { Application } from "pixi.js";

export type RuntimeContext = {
  abortController: AbortController;
  app: Application;
  audio: WebAudioAdapter;
  mode: UIMode;

  // 画面・UI関係
  layers: AppLayers;
  skins: SkinResolver;
  gameScreenSpec: GameScreenSpec;
  inputState: InputState;

  // UIウィジェット類
  padUI: VirtualPadUI;
  bareUI: VirtualPadUIForBare;
  bareUIShower: ScreenTouchHandler;

  // ゲーム本体
  gameRoot: GameRoot;
};
