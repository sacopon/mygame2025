import { Scene, SceneContext, SceneId } from "./scene";
import { SceneFactory } from "./scene-factory";

/**
 * ゲーム内のシーン管理
 *
 * 現在のシーンの update を呼ぶ.
 * isFinished/nextScene に従って遷移する
 * 遷移時は onExit -> createScene -> onEnter の順
 */
export class SceneManager {
  #currentScene: Scene | null = null;
  #nextSceneId: SceneId | null = null;
  #context: SceneContext;

  constructor(initialSceneId: SceneId, context: SceneContext) {
    this.#context = context;
    this.#nextSceneId = initialSceneId;
  }

  update(deltaTime: number): void {
    if (this.#nextSceneId) {
      this.#currentScene?.onExit?.();
      this.#currentScene = SceneFactory.createScene(this.#nextSceneId);
      this.#nextSceneId = null;
      this.#currentScene.onEnter?.(this.#context);
    }

    if (!this.#currentScene) {
      return;;
    }

    const isFinished = this.#currentScene.update(deltaTime);

    if (!isFinished) {
      return;
    }

    this.#nextSceneId = this.#currentScene.next();
  }
}
