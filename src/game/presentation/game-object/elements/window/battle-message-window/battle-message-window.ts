import { GroupGameObject } from "../../../../core/group-game-object";
import { DEFAULT_WINDOW_SETTINGS } from "../constants/window-constants";
import { WindowBase } from "..";
import { GamePorts } from "../../../..";
import { BattleMessageWindowContents } from "./battle-message-window-contents";

/**
 * 戦闘中(結果時以外)のメッセージウィンドウ
 */
export class BattleMessageWindow extends GroupGameObject {
  static readonly #windowSpec = {
    width: 244,
    height: 58,
    baseAlpha: DEFAULT_WINDOW_SETTINGS.baseAlpha,
  } as const;

  #content: BattleMessageWindowContents;

  constructor(ports: GamePorts) {
    super(ports);

    this.addChild(new WindowBase(ports, BattleMessageWindow.#windowSpec.width, BattleMessageWindow.#windowSpec.height, BattleMessageWindow.#windowSpec.baseAlpha));
    this.#content = this.addChild(new BattleMessageWindowContents(ports));
  }

  static get width(): number {
    return BattleMessageWindow.#windowSpec.width;
  }

  static get height(): number {
    return BattleMessageWindow.#windowSpec.height;
  }

  get width(): number {
    return BattleMessageWindow.width;
  }

  get height(): number {
    return BattleMessageWindow.height;
  }

  clearText(): void {
    this.#content.clearText();
  }

  // 最後の1行をクリアする
  removeLastText(): void {
    this.#content.removeLastText();
  }

  // 先頭行を残し、それ以降をクリアする
  removeExceptFirstText(): void {
    this.#content.removeExceptFirstText();
  }

  addText(text: string): void {
    this.#content.addText(text);
  }
}
