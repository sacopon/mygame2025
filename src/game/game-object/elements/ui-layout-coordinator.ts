import { ScreenSizeAware } from "../../core/game-component";
import { GameObject } from "../../core/game-object";
import { CommandSelectWindow, EnemySelectWindow } from "..";
import { GamePorts } from "@game/core";

/**
 * 描画を持たないゲームオブジェクト
 * ウィンドウの配置/再配置を司る
 */
export class UILayoutCoordinator extends GameObject implements ScreenSizeAware {
  #commandWindow: CommandSelectWindow;
  #enemySelectWindow: EnemySelectWindow;

  constructor(ports: GamePorts, vw: number, vh: number, windows: { commandSelectWindow: CommandSelectWindow, enemySelectWindow: EnemySelectWindow }) {
    super(ports);

    this.#commandWindow = windows.commandSelectWindow;
    this.#enemySelectWindow = windows.enemySelectWindow;
    this.#place(vw, vh);
  }

  onScreenSizeChanged(width: number, height: number): void {
    this.#place(width, height);
  }

  #place(width: number, _height: number) {
    const windowWidth = this.#commandWindow.width + this.#enemySelectWindow.width;
    const x = Math.floor((width - windowWidth) / 2);
    const y = 132;  // TODO: とりあえず適当な値

    this.#commandWindow.setPosition(x, y);
    this.#enemySelectWindow.setPosition(x + this.#commandWindow.width, y);
  }
}
