import { GroupGameObject } from "../../../../core/group-game-object";
import { WindowBase } from "..";
import { GamePorts } from "../../../..";
import { StatusWindowContents } from "./status-window-contents";
import { STATUS_WINDOW_SETTINGS } from "./status-winodw-constants";
import { ActorId, BattleDomainState } from "@game/domain";

function calcWindowHeight(forInputPhase: boolean): number {
  return STATUS_WINDOW_SETTINGS.borderHeight +
    STATUS_WINDOW_SETTINGS.marginTop +
    STATUS_WINDOW_SETTINGS.lineHeight * (forInputPhase ? 4 : 2) +
    STATUS_WINDOW_SETTINGS.marginBottom + STATUS_WINDOW_SETTINGS.borderHeight;
}

/**
 * ステータスウィンドウ
 */
export class StatusWindow extends GroupGameObject {
  static readonly #windowSpec = {
    width: STATUS_WINDOW_SETTINGS.width,
    baseAlpha: STATUS_WINDOW_SETTINGS.baseAlpha,
  } as const;

  #forInputPhase: boolean;
  #content: StatusWindowContents;

  constructor(ports: GamePorts, state: Readonly<BattleDomainState>, forInputPhase: boolean, resolveActorName: (actorId: ActorId) => string) {
    super(ports);

    this.addChild(new WindowBase(
      ports,
      StatusWindow.#windowSpec.width,
      calcWindowHeight(forInputPhase),
      StatusWindow.#windowSpec.baseAlpha));

    this.#content = this.addChild(new StatusWindowContents(ports, state, forInputPhase, resolveActorName));
    this.#content.setPosition(
      STATUS_WINDOW_SETTINGS.borderWidth + STATUS_WINDOW_SETTINGS.marginLeft,
      STATUS_WINDOW_SETTINGS.borderHeight + STATUS_WINDOW_SETTINGS.marginTop);

    this.#forInputPhase = forInputPhase;
   }

  static get width(): number {
    return StatusWindow.#windowSpec.width;
  }

  get width(): number {
    return StatusWindow.width;
  }

  get height(): number {
    return calcWindowHeight(this.#forInputPhase);
  }

  /**
   * 状態を反映する
   */
  updateState(state: Readonly<BattleDomainState>): void {
    this.#content.updateState(state);
  }
}
