import { Scene, SceneId } from ".";
import { BattleScene } from "..";

export class SceneFactory {
  static createScene(id: SceneId): Scene {
    let scene: Scene | null = null;

    switch (id) {
      case "Battle":
        scene = new BattleScene();
        break;

      default:
        const unknownId: never = id;
        throw new Error(`Unknown SceneId: ${unknownId}`);
    }

    return scene!;
  }
}
