import { GroupGameObject } from "../../../../core/group-game-object";
import { WindowBase } from "..";
import { GamePorts } from "../../../..";
import { StatusWindowContents } from "./status-window-contents";
import { STATUS_WINDOW_SETTINGS } from "./status-winodw-constants";
import { ActorId, BattleDomainState } from "@game/domain";

/**
 * ステータスウィンドウ
 */
export class StatusWindow extends GroupGameObject {
  static readonly #windowSpec = {
    width: STATUS_WINDOW_SETTINGS.width,
    height:
      STATUS_WINDOW_SETTINGS.borderHeight + STATUS_WINDOW_SETTINGS.marginTop +
      STATUS_WINDOW_SETTINGS.lineHeight * 4 +
      STATUS_WINDOW_SETTINGS.marginBottom + STATUS_WINDOW_SETTINGS.borderHeight,
    baseAlpha: STATUS_WINDOW_SETTINGS.baseAlpha,
  } as const;

  #content: StatusWindowContents;

  constructor(ports: GamePorts, state: Readonly<BattleDomainState>, nameResolver: (actorId: ActorId) => string) {
    super(ports);

    this.addChild(new WindowBase(ports, StatusWindow.#windowSpec.width, StatusWindow.#windowSpec.height, StatusWindow.#windowSpec.baseAlpha));
    this.#content = this.addChild(new StatusWindowContents(ports, state, nameResolver));
    this.#content.setPosition(
      STATUS_WINDOW_SETTINGS.borderWidth + STATUS_WINDOW_SETTINGS.marginLeft,
      STATUS_WINDOW_SETTINGS.borderHeight + STATUS_WINDOW_SETTINGS.marginTop);
  }

  static get width(): number {
    return StatusWindow.#windowSpec.width;
  }

  static get height(): number {
    return StatusWindow.#windowSpec.height;
  }

  get width(): number {
    return StatusWindow.width;
  }

  get height(): number {
    return StatusWindow.height;
  }

  /**
   * 状態を反映する
   */
  updateState(state: Readonly<BattleDomainState>): void {
    this.#content.updateState(state);
  }
}
