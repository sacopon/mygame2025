import { BattleScene } from "./battle-scene";
import type { Scene, SceneId } from "./scene";

export class SceneFactory {
  public static createScene(id: SceneId): Scene {
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
