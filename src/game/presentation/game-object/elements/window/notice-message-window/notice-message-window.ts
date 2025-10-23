import { GroupGameObject } from "../../../../core/group-game-object";
import { DEFAULT_WINDOW_SETTINGS } from "../constants/window-constants";
import { WindowBase } from "..";
import { GamePorts } from "../../../..";
import { NoticeMessageWindowContents } from "./notice-message-window-contents";

/**
 * 戦闘中(結果時以外)のメッセージウィンドウ
 */
export class NoticeMessageWindow extends GroupGameObject {
  static readonly #windowSpec = {
    width: 240,
    height: DEFAULT_WINDOW_SETTINGS.borderHeight + DEFAULT_WINDOW_SETTINGS.marginTop + DEFAULT_WINDOW_SETTINGS.lineHeight + DEFAULT_WINDOW_SETTINGS.marginBottom + DEFAULT_WINDOW_SETTINGS.borderHeight,
    baseAlpha: DEFAULT_WINDOW_SETTINGS.baseAlpha,
  } as const;

  #content: NoticeMessageWindowContents;

  constructor(ports: GamePorts, text: string) {
    super(ports);

    this.addChild(new WindowBase(ports, NoticeMessageWindow.#windowSpec.width, NoticeMessageWindow.#windowSpec.height, NoticeMessageWindow.#windowSpec.baseAlpha));
    this.#content = this.addChild(new NoticeMessageWindowContents(ports, text));
    this.#content.setPosition(
      Math.floor((this.width - this.#content.width) / 2),
      Math.floor((this.height - this.#content.height) / 2));
  }

  get width(): number {
    return NoticeMessageWindow.#windowSpec.width;
  }

  get height(): number {
    return NoticeMessageWindow.#windowSpec.height;
  }
}
