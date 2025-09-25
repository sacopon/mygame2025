import { GameObject, GamePorts } from "@game/core";
import { ENEMY_SELECT_WINDOW_SETTINGS } from "@game/game-object/enemy-select-window";


export class EnemySelectWindow extends GameObject {
  #windowSize = {
    width: 168,
    height: ENEMY_SELECT_WINDOW_SETTINGS.borderHeight + ENEMY_SELECT_WINDOW_SETTINGS.marginTop + (ENEMY_SELECT_WINDOW_SETTINGS.fontSize + ENEMY_SELECT_WINDOW_SETTINGS.lineMargin) * ENEMY_SELECT_WINDOW_SETTINGS.maxLines - ENEMY_SELECT_WINDOW_SETTINGS.lineMargin + ENEMY_SELECT_WINDOW_SETTINGS.marginBottom + ENEMY_SELECT_WINDOW_SETTINGS.borderHeight,
  };
  #base: GameObject;
  #enemyNamesObject: GameObject;

  constructor(ports: GamePorts, base: GameObject, enemyNamesObject: GameObject) {
    super(ports);

    this.setPosition(0, 0); // 位置は UILayoutCoordinator が決める
    this.#base = base;
    this.#enemyNamesObject = enemyNamesObject;
  }

  public setPosition(x: number, y: number) {
    super.setPosition(x, y);
    this.#base?.setPosition(x, y);

    const enemyNamesPos = { x: 4 + 2 + 10, y: ENEMY_SELECT_WINDOW_SETTINGS.borderHeight + ENEMY_SELECT_WINDOW_SETTINGS.marginTop };
    this.#enemyNamesObject?.setPosition(x + enemyNamesPos.x, y + enemyNamesPos.y);
  }

  getWidth(): number {
    return this.#windowSize.width;
  }

  getHeight(): number {
    return this.#windowSize.height;
  }
}
