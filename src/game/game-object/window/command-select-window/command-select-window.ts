import { GameObject, GamePorts } from "@game/core";
import { WindowCursor } from "@game/game-object/elements";
import { CommandSelectWindowCommandTexts } from "@game/game-object/window/command-select-window/command-select-window-command-texts";
import { CommandSelectWindowBase } from "@game/game-object/window/command-select-window/command-select-window-base";
import { COMMAND_SELECT_WINDOW_SETTINGS } from "@game/game-object/window/command-select-window/command-select-window-constants";

const fontSize = 10;
const borderWidth = 4;
const borderHeight = 4;
const marginTop = 4;
const marginBottom = 4;
const marginLeft = 4;
const marginRight = 4;
const maxCharCount = 5;
const lineMargin = Math.floor(fontSize * 0.5);
const lineHeight = fontSize + lineMargin;
const maxLines = 4;

export class CommandSelectWindow extends GameObject {
  #base: CommandSelectWindowBase;
  #commandTextsObject: CommandSelectWindowCommandTexts;
  #cursor: WindowCursor;
  #selectedIndex = 0;

  static readonly #windowSpec = {
    // 位置は UILayoutCoordinator が決定する
    x: 0,
    y: 0,
    width: borderWidth + marginLeft + fontSize * maxCharCount + marginRight + borderWidth,
    height: borderHeight + marginTop + lineHeight * maxLines  - lineMargin + marginBottom + borderHeight,
  };

  constructor(
    ports: GamePorts,
    gameObjects: {
      base: CommandSelectWindowBase,
      commandTextsObject: CommandSelectWindowCommandTexts,
      cursor: WindowCursor,
    }) {
    super(ports);

    // TODO: レイアウトが決める
    this.setPosition(CommandSelectWindow.#windowSpec.x, CommandSelectWindow.#windowSpec.y);

    this.#base = gameObjects.base;
    this.#commandTextsObject = gameObjects.commandTextsObject;
    this.#cursor = gameObjects.cursor;
    this.setPosition(0, 0); // 位置は UILayoutCoordinator が決める

    // // 中身
    // this.#textList = this.addComponent(new TextListComponent(
    //   ["たたかう", "ぼうぎょ", "じゅもん", "どうぐ"],
    //   { fontFamily: "BestTen", fontSize: 10, },
    //   {
    //     offsetX: borderWidth + marginLeft + fontSize,
    //     offsetY: borderHeight + marginTop,
    //     lineHeight,
    //   }))!;
  }

  setPosition(x: number, y: number) {
    super.setPosition(x, y);
    this.#base?.setPosition(x, y);

    const commandTextsPos = { x: 4 + 2 + 10, y: COMMAND_SELECT_WINDOW_SETTINGS.borderHeight + COMMAND_SELECT_WINDOW_SETTINGS.marginTop };
    this.#commandTextsObject?.setPosition(x + commandTextsPos.x, y + commandTextsPos.y);

    // const cursorPos = this.getCursorPos(this.#selctedIndex);
    // this.#cursor?.setCursorMiddleRight(cursorPos.x, cursorPos.y);
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
}
