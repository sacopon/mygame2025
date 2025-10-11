import { CommandSelectWindow } from "./command-select-window";
import { CommandSelectWindowBase } from "./command-select-window-base";
import { COMMAND_SELECT_WINDOW_SETTINGS } from "./command-select-window-constants";
import { WindowTextsVertical } from "..";
import { WindowCursor } from "../../";
import { GamePorts } from "@game/core";
import { GameObjectAccess, BattleCommand } from "@game/scene";

/**
 * コマンド選択ウィンドウの部品を生成して、コマンド選択ウィンドウを組み立てるクラス
 */
export class CommandSelectWindowBuilder {
  #gameObjectAccess: GameObjectAccess;
  #ports: GamePorts;

  constructor(gameObjectAccess: GameObjectAccess, ports: GamePorts) {
    this.#gameObjectAccess = gameObjectAccess;
    this.#ports = ports;
  }

  build() {
    const commandSelectWindowBase = new CommandSelectWindowBase(this.#ports, CommandSelectWindow.width, CommandSelectWindow.height);
    const commands = [
      BattleCommand.Attack,
      BattleCommand.Spell,
      BattleCommand.Defence,
      BattleCommand.Item,
    ];
    const commandSelectWindowCommandTexts = new WindowTextsVertical(
      this.#ports,
      commands,
      {
        fontFamily: COMMAND_SELECT_WINDOW_SETTINGS.fontFamily,
        fontSize: COMMAND_SELECT_WINDOW_SETTINGS.fontSize,
        lineHeight: COMMAND_SELECT_WINDOW_SETTINGS.lineHeight,
      });

    const cursor = new WindowCursor(this.#ports);
    const commandSelectWindow = new CommandSelectWindow(
      this.#ports,
      commands,
      {
        base: commandSelectWindowBase,
        commandTextsObject: commandSelectWindowCommandTexts,
        cursor,
      });

    this.#gameObjectAccess.spawnGameObject(commandSelectWindowBase);
    this.#gameObjectAccess.spawnGameObject(commandSelectWindowCommandTexts);
    this.#gameObjectAccess.spawnGameObject(cursor);

    return this.#gameObjectAccess.spawnGameObject(commandSelectWindow) as CommandSelectWindow;
  }
}
