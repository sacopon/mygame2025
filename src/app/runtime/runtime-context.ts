import { WebAudioAdapter } from "@app/adapters";
import { AppLayers } from "@app/config";
import { ScreenTouchHandler, SkinResolver, UIMode, VirtualPadUI, VirtualPadUIForBare } from "@app/features";
import { GameScreenSpec } from "@app/services";
import { GameRoot } from "@game/presentation";
import { InputState } from "@shared/input";
import { Application } from "pixi.js";

export type RuntimeContext = {
  abortController: AbortController,

  app: Application,
  audio: WebAudioAdapter,

  gameRoot: GameRoot,
  gameScreenSpec: GameScreenSpec,

  layers: AppLayers,
  skins: SkinResolver,

  inputState: InputState,
  mode: UIMode,

  padUI: VirtualPadUI,  // TODO: bare モード時は null ?
  bareUI: VirtualPadUIForBare,
  bareUIShower: ScreenTouchHandler,
};
