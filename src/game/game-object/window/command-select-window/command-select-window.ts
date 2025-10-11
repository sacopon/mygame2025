import { GroupGameObject } from "../../../core/group-game-object";
import { CommandSelectWindowBase } from "./command-select-window-base";
import { CommandSelectWindowCommandTexts } from "./command-select-window-command-texts";
import { COMMAND_SELECT_WINDOW_SETTINGS } from "./command-select-window-constants";
import { WindowCursor } from "../..";
import { GamePorts } from "@game/core";
import { BattleCommand } from "@game/scene";

/**
 * コマンド選択ウィンドウ
 * TODO: 中身を Content として分離し、ウィンドウそのものは共通化する
 */
export class CommandSelectWindow extends GroupGameObject {
  #base: CommandSelectWindowBase;
  #commandTextsObject: CommandSelectWindowCommandTexts;
  #cursor: WindowCursor;
  #commands: BattleCommand[];
  #selectedIndex = 0;

  static readonly #windowSpec = {
    width:
      COMMAND_SELECT_WINDOW_SETTINGS.borderWidth + COMMAND_SELECT_WINDOW_SETTINGS.marginLeft
      + COMMAND_SELECT_WINDOW_SETTINGS.fontSize * COMMAND_SELECT_WINDOW_SETTINGS.maxCharCount
      + COMMAND_SELECT_WINDOW_SETTINGS.marginRight + COMMAND_SELECT_WINDOW_SETTINGS.borderWidth,
    height:
      COMMAND_SELECT_WINDOW_SETTINGS.borderHeight + COMMAND_SELECT_WINDOW_SETTINGS.marginTop
      + COMMAND_SELECT_WINDOW_SETTINGS.lineHeight * COMMAND_SELECT_WINDOW_SETTINGS.maxLines
      - COMMAND_SELECT_WINDOW_SETTINGS.lineMargin
      + COMMAND_SELECT_WINDOW_SETTINGS.marginBottom + COMMAND_SELECT_WINDOW_SETTINGS.borderHeight,
  };

  constructor(
    ports: GamePorts,
    commands: BattleCommand[],
    gameObjects: {
      base: CommandSelectWindowBase,
      commandTextsObject: CommandSelectWindowCommandTexts,  // TODO: 外からもらうのではなく中で作った方が良さそう
      cursor: WindowCursor,
    }) {
    super(ports);

    this.#commands = commands;
    this.#base = gameObjects.base;
    this.#commandTextsObject = gameObjects.commandTextsObject;
    this.#cursor = gameObjects.cursor;
    this.setPosition(0, 0); // 位置は UILayoutCoordinator が決める
  }

  setPosition(x: number, y: number) {
    super.setPosition(x, y);
    this.#base?.setPosition(x, y);

    const commandTextsPos = { x: 4 + 2 + 10, y: COMMAND_SELECT_WINDOW_SETTINGS.borderHeight + COMMAND_SELECT_WINDOW_SETTINGS.marginTop };
    this.#commandTextsObject?.setPosition(x + commandTextsPos.x, y + commandTextsPos.y);

    this.#updateCursorPos();
  }

  setActive(active: boolean): void {
    this.#cursor.setEnable(active);
    // TODO: 非アクティブ時は薄暗くする？
  }

  getCurrent(): BattleCommand {
    return this.#commands[this.#selectedIndex];
  }

  select(index: number) {
    if (index < 0 || this.#selectionCount <= index) {
      return;
    }

    if (index === this.#selectedIndex) {
      return;
    }

    this.#selectedIndex = index;
    this.#updateCursorPos();
  }

  selectNext(): void {
    // TODO: select() を利用する
    ++this.#selectedIndex;

    if (this.#commandTextsObject.textLines.length <= this.#selectedIndex) {
      this.#selectedIndex = 0;
    }

    this.#updateCursorPos();
  }

  selectPrev(): void {
    // TODO: select() を利用する
    --this.#selectedIndex;

    if (this.#selectedIndex < 0) {
      this.#selectedIndex = this.#commandTextsObject.textLines.length - 1;
    }

    this.#updateCursorPos();
  }

  reset(): void {
    this.select(0);
  }

  get width(): number {
    return CommandSelectWindow.width;
  }

  get height(): number {
    return CommandSelectWindow.height;
  }

  static get width(): number {
    return CommandSelectWindow.#windowSpec.width;
  }

  static get height(): number {
    return CommandSelectWindow.#windowSpec.height;
  }

  get #selectionCount(): number {
    return this.#commandTextsObject.textLines.length;
  }

  #updateCursorPos() {
    const cursorPos = this.#getCursorPos(this.#selectedIndex);
    this.#cursor?.setCursorMiddleRight(cursorPos.x, cursorPos.y);
  }

  #getCursorPos(index: number): { x: number, y: number } {
    return {
      x: this.#commandTextsObject?.transform.x + COMMAND_SELECT_WINDOW_SETTINGS.cursorMarginX,
      y: this.#commandTextsObject?.getLineMidY(index) + COMMAND_SELECT_WINDOW_SETTINGS.cursorBaselineTweak,
    };
  }
}
