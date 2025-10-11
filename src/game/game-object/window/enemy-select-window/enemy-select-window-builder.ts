import { EnemySelectWindow } from "./enemy-select-window";
import { EnemySelectWindowBase } from "./enemy-select-window-base";
import { ENEMY_SELECT_WINDOW_SETTINGS, WindowTextsVertical } from "..";
import { WindowCursor } from "../..";
import { GamePorts } from "@game/core";
import { GameObjectAccess } from "@game/scene";

/**
 * 敵選択ウィンドウの部品を生成して、敵選択ウィンドウを組み立てるクラス
 */
export class EnemySelectWindowBuilder {
  #gameObjectAccess: GameObjectAccess;
  #ports: GamePorts;

  constructor(gameObjectAccess: GameObjectAccess, ports: GamePorts) {
    this.#gameObjectAccess = gameObjectAccess;
    this.#ports = ports;
  }

  build() {
    const monsterNames = ["グレイトドラゴン", "グリズリー", "さまようよろい", "ドラキー", "スライム"];
    const monsterCounts = ["ー １匹", "ー ３匹", "ー ４匹", "ー ７匹", "ー ８匹"];

    const enemySelectWindowBase = new EnemySelectWindowBase(this.#ports, EnemySelectWindow.width, EnemySelectWindow.height);
    const enemySelectWindowEnemyName = new WindowTextsVertical(
      this.#ports,
      monsterNames,
      {
        fontFamily: ENEMY_SELECT_WINDOW_SETTINGS.fontFamily,
        fontSize: ENEMY_SELECT_WINDOW_SETTINGS.fontSize,
        lineHeight: ENEMY_SELECT_WINDOW_SETTINGS.lineHeight,
      });
    const enemySelectWindowEnemyCount = new WindowTextsVertical(
      this.#ports,
      monsterCounts,
      {
        fontFamily: ENEMY_SELECT_WINDOW_SETTINGS.fontFamily,
        fontSize: ENEMY_SELECT_WINDOW_SETTINGS.fontSize,
        lineHeight: ENEMY_SELECT_WINDOW_SETTINGS.lineHeight,
      });

    const cursor = new WindowCursor(this.#ports);
    const enemySelectWindow = new EnemySelectWindow(
      this.#ports,
      {
        base: enemySelectWindowBase,
        enemyNamesObject: enemySelectWindowEnemyName,
        enemyCountObject: enemySelectWindowEnemyCount,
        cursor,
      });

    this.#gameObjectAccess.spawnGameObject(enemySelectWindowBase);
    this.#gameObjectAccess.spawnGameObject(enemySelectWindowEnemyName);
    this.#gameObjectAccess.spawnGameObject(enemySelectWindowEnemyCount);
    this.#gameObjectAccess.spawnGameObject(cursor);

    return this.#gameObjectAccess.spawnGameObject(enemySelectWindow) as EnemySelectWindow;
  }
}
