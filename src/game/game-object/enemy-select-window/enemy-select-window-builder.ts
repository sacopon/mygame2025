import { GamePorts } from "@game/core";
import { GameObjectAccess } from "@game/scene";
import { EnemySelectWindowBase } from "./enemy-select-window-base";
import { EnemySelectWindowEnemyNames } from "./enemy-select-window-enemy-names";
import { EnemySelectWindow } from "./enemy-select-window";

export class EnemySelectWindowBuilder {
  #gameObjectAccess: GameObjectAccess;
  #ports: GamePorts;

  constructor(gameObjectAccess: GameObjectAccess, ports: GamePorts) {
    this.#gameObjectAccess = gameObjectAccess;
    this.#ports = ports;
  }

  build() {
    const enemySelectWindowBase = this.#gameObjectAccess.spawnGameObject(new EnemySelectWindowBase(this.#ports)) as EnemySelectWindowBase;
    const enemySelectWindowEnemyNames = this.#gameObjectAccess.spawnGameObject(new EnemySelectWindowEnemyNames(this.#ports)) as EnemySelectWindowEnemyNames;

    return this.#gameObjectAccess.spawnGameObject(new EnemySelectWindow(this.#ports, enemySelectWindowBase, enemySelectWindowEnemyNames)) as EnemySelectWindow;
  }
}
