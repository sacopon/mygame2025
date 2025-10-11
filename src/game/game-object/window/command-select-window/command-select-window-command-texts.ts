import { WindowTextsVertical } from "../common/window-texts-vertical";
import { COMMAND_SELECT_WINDOW_SETTINGS } from "./command-select-window-constants";
import { GamePorts } from "@game/core";

/**
 * キャラクターのコマンド選択ウィンドウのテキスト表示(複数行)
 */
export class CommandSelectWindowCommandTexts extends WindowTextsVertical {
  constructor(ports: GamePorts, texts: string[]) {
    super(
      ports,
      texts,
      {
        fontFamily: COMMAND_SELECT_WINDOW_SETTINGS.fontFamily,
        fontSize: COMMAND_SELECT_WINDOW_SETTINGS.fontSize,
        lineHeight: COMMAND_SELECT_WINDOW_SETTINGS.lineHeight,
      });
  }
}
