import { GameObject, GamePorts } from "@game/core";
import { WindowCursor } from "@game/game-object/elements";
import { CommandSelectWindowCommandTexts } from "@game/game-object/window/command-select-window/command-select-window-command-texts";
import { CommandSelectWindowBase } from "@game/game-object/window/command-select-window/command-select-window-base";
import { COMMAND_SELECT_WINDOW_SETTINGS } from "@game/game-object/window/command-select-window/command-select-window-constants";
import { GameButton } from "@game/ports";

export class CommandSelectWindow extends GameObject {
  #base: CommandSelectWindowBase;
  #commandTextsObject: CommandSelectWindowCommandTexts;
  #cursor: WindowCursor;
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
    gameObjects: {
      base: CommandSelectWindowBase,
      commandTextsObject: CommandSelectWindowCommandTexts,
      cursor: WindowCursor,
    }) {
    super(ports);

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

    const cursorPos = this.#getCursorPos(this.#selectedIndex);
    this.#cursor?.setCursorMiddleRight(cursorPos.x, cursorPos.y);
  }

  setActive(active: boolean): void {
    this.#cursor.setEnable(active);
    // TODO: 非アクティブ時は薄暗くする？
  }

  update(_: number): void {
    const prevSelectedIndex = this.#selectedIndex;

    if (this.input.pressed(GameButton.Up)) {
      --this.#selectedIndex;

      if (this.#selectedIndex < 0) {
        this.#selectedIndex = this.#commandTextsObject.textLines.length - 1;
      }
    }

    if (this.input.pressed(GameButton.Down)) {
      ++this.#selectedIndex;

      if (this.#commandTextsObject.textLines.length <= this.#selectedIndex) {
        this.#selectedIndex = 0;
      }
    }

    if (this.#selectedIndex !== prevSelectedIndex) {
      const cursorPos = this.#getCursorPos(this.#selectedIndex);
      this.#cursor?.setCursorMiddleRight(cursorPos.x, cursorPos.y);
    }
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

  #getCursorPos(index: number): { x: number, y: number } {
    return {
      x: this.#commandTextsObject?.transform.x + COMMAND_SELECT_WINDOW_SETTINGS.cursorMarginX,
      y: this.#commandTextsObject?.getLineMidY(index) + COMMAND_SELECT_WINDOW_SETTINGS.cursorBaselineTweak,
    };
  }
}
