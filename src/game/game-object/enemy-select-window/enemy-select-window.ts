import { GameObject, GamePorts } from "@game/core";
import { ENEMY_SELECT_WINDOW_SETTINGS } from "@game/game-object/enemy-select-window";
import { WindowCursor } from "../elements/window-cursor";
import { GameButton } from "@game/ports";
import { EnemySelectWindowEnemyTexts } from "./enemy-select-window-enemy-texts";

/**
 * 敵選択ウィンドウの挙動や配置を司るクラス
 */
export class EnemySelectWindow extends GameObject {
  static readonly #windowSize = {
    width: 168,
    height: ENEMY_SELECT_WINDOW_SETTINGS.borderHeight
      + ENEMY_SELECT_WINDOW_SETTINGS.marginTop
      + (ENEMY_SELECT_WINDOW_SETTINGS.fontSize
      + ENEMY_SELECT_WINDOW_SETTINGS.lineMargin) * ENEMY_SELECT_WINDOW_SETTINGS.maxLines
      - ENEMY_SELECT_WINDOW_SETTINGS.lineMargin
      + ENEMY_SELECT_WINDOW_SETTINGS.marginBottom
      + ENEMY_SELECT_WINDOW_SETTINGS.borderHeight,
  };
  #base: GameObject;
  #enemyNamesObject: EnemySelectWindowEnemyTexts;
  #enemyCountObject: GameObject;
  #cursor: WindowCursor;
  #selctedIndex = 0;

  constructor(
    ports: GamePorts,
    gameObjects: {
      base: GameObject,
      enemyNamesObject: EnemySelectWindowEnemyTexts,
      enemyCountObject: GameObject,
      cursor: GameObject,
    }) {
    super(ports);

    this.#base = gameObjects.base;
    this.#enemyNamesObject = gameObjects.enemyNamesObject;
    this.#enemyCountObject = gameObjects.enemyCountObject;
    this.#cursor = gameObjects.cursor as WindowCursor;
    this.setPosition(0, 0); // 位置は UILayoutCoordinator が決める
  }

  setPosition(x: number, y: number) {
    super.setPosition(x, y);
    this.#base?.setPosition(x, y);

    const enemyNamesPos = { x: 4 + 2 + 10, y: ENEMY_SELECT_WINDOW_SETTINGS.borderHeight + ENEMY_SELECT_WINDOW_SETTINGS.marginTop };
    this.#enemyNamesObject?.setPosition(x + enemyNamesPos.x, y + enemyNamesPos.y);

    const enemyCountPos = { x: 112, y: ENEMY_SELECT_WINDOW_SETTINGS.borderHeight + ENEMY_SELECT_WINDOW_SETTINGS.marginTop };
    this.#enemyCountObject?.setPosition(x + enemyCountPos.x, y + enemyCountPos.y);

    const cursorPos = this.getCursorPos(this.#selctedIndex);
    this.#cursor?.setCursorMiddleRight(cursorPos.x, cursorPos.y);
  }

  getCursorPos(index: number): { x: number, y: number } {
    const cursorMargin = 4;

    return {
      x: this.#enemyNamesObject?.transform.x - cursorMargin,
      y: this.#enemyNamesObject?.transform.y + ENEMY_SELECT_WINDOW_SETTINGS.lineHeight * index + Math.floor(ENEMY_SELECT_WINDOW_SETTINGS.lineHeight / 2) - 2,
    };
  }

  public update(_: number): void {
    if (this.input.pressed(GameButton.Up)) {
      --this.#selctedIndex;

      if (this.#selctedIndex < 0) {
        this.#selctedIndex = this.#enemyNamesObject.textLines.length - 1;
      }
    }

    if (this.input.pressed(GameButton.Down)) {
      ++this.#selctedIndex;

      if (this.#enemyNamesObject.textLines.length <= this.#selctedIndex) {
        this.#selctedIndex = 0;
      }
    }

    const cursorPos = this.getCursorPos(this.#selctedIndex);
    this.#cursor?.setCursorMiddleRight(cursorPos.x, cursorPos.y);
  }

  static get width(): number {
    return EnemySelectWindow.#windowSize.width;
  }

  static get height(): number {
    return EnemySelectWindow.#windowSize.height;
  }
}
