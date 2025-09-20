import { Background, BattleBackground, CommandSelectWindow, Enemy, EnemySelectWindow, MainWindow, Smile, UILayoutCoordinator } from "@game/game-object";
import { Scene, SceneContext, SceneId } from "./scene";

export class BattleScene implements Scene {
  public constructor() {
  }

  public onEnter(context: SceneContext) {
    const { width, height } = context.ports.screen.getGameSize();

    context.gameObjectAccess.spawnGameObject(new Background(context.ports, width, height));
    context.gameObjectAccess.spawnGameObject(new BattleBackground(context.ports, width, height));
    context.gameObjectAccess.spawnGameObject(new MainWindow(context.ports, width, height));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 0));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 1));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 2));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 3));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 4));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 5));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 6));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 7));
    context.gameObjectAccess.spawnGameObject(new Smile(context.ports, width, height));
    const commandSelectWindow = context.gameObjectAccess.spawnGameObject(new CommandSelectWindow(context.ports, width, height)) as CommandSelectWindow;
    const enemySelectWindow = context.gameObjectAccess.spawnGameObject(new EnemySelectWindow(context.ports, width, height)) as EnemySelectWindow;
    context.gameObjectAccess.spawnGameObject(new UILayoutCoordinator(context.ports, width, height, { commandSelectWindow, enemySelectWindow }));
  }

  next(): SceneId {
    throw new Error("Method not implemented.");
  }

  public update(_deltaTime: number): boolean {
    return false;
  }
}
