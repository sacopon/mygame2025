import { Background, Smile } from "@game/game-object";
import { Scene, SceneContext, SceneId } from "./scene";

export class BattleScene implements Scene {
  public constructor() {
  }

  public onEnter(context: SceneContext) {
    const { width, height } = context.ports.screen.getGameSize();

    context.gameObjectAccess.spawnGameObject(new Background(context.ports, width, height));
    context.gameObjectAccess.spawnGameObject(new Smile(context.ports, width, height));
  }

  next(): SceneId {
    throw new Error("Method not implemented.");
  }

  public update(_deltaTime: number): boolean {
    return false;
  }
}
