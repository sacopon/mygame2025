import { GameObject } from "../../core/game-object";
import { ScreenSizeAware } from "../../core/game-component";
import { BattleMessageWindow, CommandSelectWindow, EnemySelectWindow } from "..";
import { GamePorts } from "@game/presentation";

type Windows = {
  commandSelectWindow?: CommandSelectWindow;
  enemySelectWindow?: EnemySelectWindow;
  messageWindow?: BattleMessageWindow;
}

/**
 * 描画を持たないゲームオブジェクト
 * ウィンドウの配置/再配置を司る
 */
export class UILayoutCoordinator extends GameObject implements ScreenSizeAware {
  #commandWindow?: CommandSelectWindow;
  #enemySelectWindow?: EnemySelectWindow;
  #messageWindow?: BattleMessageWindow;

  constructor(ports: GamePorts, vw: number, vh: number, windows: Windows) {
    super(ports);

    this.#commandWindow = windows.commandSelectWindow;
    this.#enemySelectWindow = windows.enemySelectWindow;
    this.#messageWindow = windows.messageWindow;
    this.#place(vw, vh);
  }

  onScreenSizeChanged(width: number, height: number): void {
    this.#place(width, height);
  }

  #place(width: number, height: number) {
    this.#placeInputWindow(width, height);
    this.#placeMessageWindow(width, height);
  }

  #placeInputWindow(width: number, _height: number) {
    if (!this.#commandWindow || !this.#enemySelectWindow) {
      return;
    }

    const windowWidth = this.#commandWindow.width + this.#enemySelectWindow.width;
    const x = Math.floor((width - windowWidth) / 2);
    const y = 120;

    this.#commandWindow.setPosition(x, y);
    this.#enemySelectWindow.setPosition(x + this.#commandWindow.width, this.#commandWindow.transform.y + 19);
  }

  #placeMessageWindow(width: number, _height: number) {
    if (!this.#messageWindow) {
      return;
    }

    this.#messageWindow.setPosition(Math.floor((width - this.#messageWindow.width) / 2), 140);
  }
}
