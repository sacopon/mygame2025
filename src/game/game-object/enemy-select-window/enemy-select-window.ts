import { GameObject, GamePorts } from "@game/core";
import { ENEMY_SELECT_WINDOW_SETTINGS } from "@game/game-object/enemy-select-window";

/**
 * 敵生成ウィンドウの挙動や配置を司るクラス
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
  #enemyNamesObject: GameObject;
  #enemyCountObject: GameObject;

  constructor(ports: GamePorts, base: GameObject, enemyNamesObject: GameObject, enemyCountObject: GameObject) {
    super(ports);

    this.setPosition(0, 0); // 位置は UILayoutCoordinator が決める
    this.#base = base;
    this.#enemyNamesObject = enemyNamesObject;
    this.#enemyCountObject = enemyCountObject;
  }

  public setPosition(x: number, y: number) {
    super.setPosition(x, y);
    this.#base?.setPosition(x, y);

    const enemyNamesPos = { x: 4 + 2 + 10, y: ENEMY_SELECT_WINDOW_SETTINGS.borderHeight + ENEMY_SELECT_WINDOW_SETTINGS.marginTop };
    this.#enemyNamesObject?.setPosition(x + enemyNamesPos.x, y + enemyNamesPos.y);

    const enemyCountPos = { x: 112, y: ENEMY_SELECT_WINDOW_SETTINGS.borderHeight + ENEMY_SELECT_WINDOW_SETTINGS.marginTop };
    this.#enemyCountObject?.setPosition(x + enemyCountPos.x, y + enemyCountPos.y);
  }

  static get width(): number {
    return EnemySelectWindow.#windowSize.width;
  }

  static get height(): number {
    return EnemySelectWindow.#windowSize.height;
  }
}
