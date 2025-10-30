import { WebAudioAdapter } from "@app/adapters";
import { AppContext } from "@app/config";
import { ScreenTouchHandler, SkinResolver, UIMode, VirtualPadUI, VirtualPadUIForBare } from "@app/features";
import { GameScreenSpec } from "@app/services";
import { GameRoot } from "@game/presentation";
import { InputState } from "@shared/input";
import { Application } from "pixi.js";

export type RuntimeContext = {
  app: Application,
  pixiLayers: AppContext,
  gameRoot: GameRoot,
  audio: WebAudioAdapter,
  inputState: InputState,
  mode: UIMode,
  padUI: VirtualPadUI,
  bareUI: VirtualPadUIForBare,
  bareUIShower: ScreenTouchHandler,
  gameScreenSpec: GameScreenSpec,
  skins: SkinResolver,
  abortController: AbortController,
};
