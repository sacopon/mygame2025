import { GroupGameObject } from "../../../../core/group-game-object";
import { DEFAULT_WINDOW_SETTINGS } from "../constants/window-constants";
import { WindowBase } from "..";
import { GamePorts } from "../../../..";

/**
 * 戦闘中(結果時以外)のメッセージウィンドウ
 */
export class BattleMessageWindow extends GroupGameObject {
  static readonly #windowSpec = {
    width: 210,
    height: 70,
    baseAlpha: DEFAULT_WINDOW_SETTINGS.baseAlpha,
  } as const;

  constructor(ports: GamePorts) {
    super(ports);

    this.addChild(new WindowBase(ports, BattleMessageWindow.#windowSpec.width, BattleMessageWindow.#windowSpec.height, BattleMessageWindow.#windowSpec.baseAlpha));
  }

  get width(): number {
    return BattleMessageWindow.#windowSpec.width;
  }

  get height(): number {
    return BattleMessageWindow.#windowSpec.height;
  }
}
