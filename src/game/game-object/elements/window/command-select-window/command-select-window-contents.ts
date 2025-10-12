import { ListWindowContents } from "../common/list-window-contents";
import { COMMAND_SELECT_WINDOW_SETTINGS } from "./command-select-window-constants";
import { WindowTextsVertical } from "../common";
import { Position } from "@shared";
import { GamePorts } from "@game/core";
import { BattleCommand } from "@game/scene";

/**
 * コマンド選択ウィンドウの中身部分
 */
export class CommandSelectWindowContents extends ListWindowContents {
  #commandTextsObject: WindowTextsVertical;

  constructor(ports: GamePorts, commands: BattleCommand[]) {
    super(ports);

    this.#commandTextsObject = this.addChild(new WindowTextsVertical(
      ports,
      commands,
      {
        fontFamily: COMMAND_SELECT_WINDOW_SETTINGS.fontFamily,
        fontSize: COMMAND_SELECT_WINDOW_SETTINGS.fontSize,
        lineHeight: COMMAND_SELECT_WINDOW_SETTINGS.lineHeight,
      }));

    const commandTextsPos = {
      x: COMMAND_SELECT_WINDOW_SETTINGS.borderWidth + 2 + COMMAND_SELECT_WINDOW_SETTINGS.fontSize,
      y: COMMAND_SELECT_WINDOW_SETTINGS.borderHeight + COMMAND_SELECT_WINDOW_SETTINGS.marginTop,
    };
    this.#commandTextsObject.setPosition(commandTextsPos.x, commandTextsPos.y);
  }

  override getCursorLocalPos(index: number): Position {
    return {
      x: this.#commandTextsObject.transform.x + COMMAND_SELECT_WINDOW_SETTINGS.cursorMarginX,
      y: this.#commandTextsObject.getLineMidY(index) + COMMAND_SELECT_WINDOW_SETTINGS.cursorBaselineTweak,
    };
  }
}
