import { GameObject, GamePorts } from "@game/core";
import { ENEMY_SELECT_WINDOW_SETTINGS } from "@game/game-object/window/enemy-select-window";
import { WindowCursor } from "../../elements/window-cursor";
import { EnemySelectWindowEnemyTexts } from "@game/game-object/window/enemy-select-window/enemy-select-window-enemy-texts";
import { EnemySelectWindowBase } from "@game/game-object/window/enemy-select-window/enemy-select-window-base";

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
  #base: EnemySelectWindowBase;
  #enemyNamesObject: EnemySelectWindowEnemyTexts;
  #enemyCountObject: GameObject;
  #cursor: WindowCursor;
  #selectedIndex = 0;

  constructor(
    ports: GamePorts,
    gameObjects: {
      base: EnemySelectWindowBase,
      enemyNamesObject: EnemySelectWindowEnemyTexts,
      enemyCountObject: EnemySelectWindowEnemyTexts,
      cursor: WindowCursor,
    }) {
    super(ports);

    this.#base = gameObjects.base;
    this.#enemyNamesObject = gameObjects.enemyNamesObject;
    this.#enemyCountObject = gameObjects.enemyCountObject;
    this.#cursor = gameObjects.cursor;
    this.setPosition(0, 0); // 位置は UILayoutCoordinator が決める
  }

  setPosition(x: number, y: number) {
    super.setPosition(x, y);
    this.#base?.setPosition(x, y);

    const enemyNamesPos = { x: 4 + 2 + 10, y: ENEMY_SELECT_WINDOW_SETTINGS.borderHeight + ENEMY_SELECT_WINDOW_SETTINGS.marginTop };
    this.#enemyNamesObject?.setPosition(x + enemyNamesPos.x, y + enemyNamesPos.y);

    const enemyCountPos = { x: 112, y: ENEMY_SELECT_WINDOW_SETTINGS.borderHeight + ENEMY_SELECT_WINDOW_SETTINGS.marginTop };
    this.#enemyCountObject?.setPosition(x + enemyCountPos.x, y + enemyCountPos.y);

    this.#updateCursorPos();
  }

  setActive(active: boolean): void {
    this.#cursor.setEnable(active);
  }

  getCurrent(): string {
    // TODO: ID的なものに
    return this.#enemyNamesObject.textLines[this.#selectedIndex];
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

    if (this.#enemyNamesObject.textLines.length <= this.#selectedIndex) {
      this.#selectedIndex = 0;
    }

    this.#updateCursorPos();
  }

  selectPrev(): void {
    // TODO: select() を利用する
    --this.#selectedIndex;

    if (this.#selectedIndex < 0) {
      this.#selectedIndex = this.#enemyNamesObject.textLines.length - 1;
    }

    this.#updateCursorPos();
  }

  reset(): void {
    this.select(0);
  }

  get width(): number {
    return EnemySelectWindow.width;
  }

  get height(): number {
    return EnemySelectWindow.height;
  }

  static get width(): number {
    return EnemySelectWindow.#windowSize.width;
  }

  static get height(): number {
    return EnemySelectWindow.#windowSize.height;
  }

  get #selectionCount(): number {
    return this.#enemyNamesObject.textLines.length;
  }

  #updateCursorPos() {
    const cursorPos = this.#getCursorPos(this.#selectedIndex);
    this.#cursor?.setCursorMiddleRight(cursorPos.x, cursorPos.y);
  }

  #getCursorPos(index: number): { x: number, y: number } {
    return {
      x: this.#enemyNamesObject?.transform.x + ENEMY_SELECT_WINDOW_SETTINGS.cursorMarginX,
      y: this.#enemyNamesObject?.getLineMidY(index) + ENEMY_SELECT_WINDOW_SETTINGS.cursorBaselineTweak,
    };
  }
}
