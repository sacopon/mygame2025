import { GamePorts } from "@game/core";
import { GameObjectAccess } from "@game/scene";
import { EnemySelectWindowBase } from "./enemy-select-window-base";
import { EnemySelectWindowEnemyTexts } from "./enemy-select-window-enemy-texts";
import { EnemySelectWindow } from "./enemy-select-window";

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
    const enemySelectWindowBase = new EnemySelectWindowBase(this.#ports, EnemySelectWindow.width, EnemySelectWindow.height);
    const enemySelectWindowEnemyName = new EnemySelectWindowEnemyTexts(this.#ports, ["キングスライム", "グリズリー", "さまようよろい", "ドラキー", "スライム"]);
    const enemySelectWindowEnemyCount = new EnemySelectWindowEnemyTexts(this.#ports, ["ー　１匹", "ー　３匹", "ー　４匹", "ー　７匹", "ー　８匹"]);
    const enemySelectWindow = new EnemySelectWindow(
      this.#ports,
      enemySelectWindowBase,
      enemySelectWindowEnemyName,
      enemySelectWindowEnemyCount);

    this.#gameObjectAccess.spawnGameObject(enemySelectWindowBase);
    this.#gameObjectAccess.spawnGameObject(enemySelectWindowEnemyName);
    this.#gameObjectAccess.spawnGameObject(enemySelectWindowEnemyCount);

    return this.#gameObjectAccess.spawnGameObject(enemySelectWindow) as EnemySelectWindow;
  }
}
