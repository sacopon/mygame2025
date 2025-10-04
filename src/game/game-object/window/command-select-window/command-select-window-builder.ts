import { GamePorts } from "@game/core";
import { GameObjectAccess } from "@game/scene";
import { WindowCursor } from "@game/game-object/elements";
import { CommandSelectWindow } from "@game/game-object/window/command-select-window";
import { CommandSelectWindowBase } from "@game/game-object/window/command-select-window/command-select-window-base";
import { CommandSelectWindowCommandTexts } from "./command-select-window-command-texts";

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
    const commandSelectWindowCommandTexts = new CommandSelectWindowCommandTexts(this.#ports, ["たたかう", "ぼうぎょ", "じゅもん", "どうぐ"]);
    const cursor = new WindowCursor(this.#ports);
    const commandSelectWindow = new CommandSelectWindow(
      this.#ports,
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
