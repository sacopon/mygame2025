import { isScreenSizeAware } from "./game-component";
import { GameObject } from "./game-object";
import { GamePorts } from "./game-ports";
import { GameObjectAccess, SceneManager } from "@game/scene";

/**
 * シーンとゲームオブジェクトを管理するルートとなるクラス
 */
export class GameRoot implements GameObjectAccess {
  #sceneManager: SceneManager;
  #objects: GameObject[] = [];
  #unsubscribeScreen?: () => void;

  constructor(ports: GamePorts) {
    const { screen } = ports;
    const { width, height } = screen.getGameSize();

    // 画面サイズ変更を購読
    this.#unsubscribeScreen = screen.onGameSizeChanged(size => {
      this.onScreenSizeChanged(size.width, size.height);
    });

    // シーンマネージャ作成
    this.#sceneManager = new SceneManager("Battle", { ports, gameObjectAccess: this });
    this.onScreenSizeChanged(width, height);
  }

  spawnGameObject<T extends GameObject>(gameObject: T): T {
    this.#objects.push(gameObject);
    return gameObject;
  }

  update(deltaTime: number) {
    this.#sceneManager.update(deltaTime);

    const list = this.#objects.slice();

    for (const o of list) {
      o.update(deltaTime);
    }
  }

  dispose() {
    this.#unsubscribeScreen?.();
    this.#unsubscribeScreen = undefined;
  }

  /**
   * ゲーム画面のサイズ変化時
   *
   * @param width  新しい幅
   * @param height 新しい高さ
   */
  onScreenSizeChanged(width: number, height: number) {
    for (const go of this.#objects) {
      if (!isScreenSizeAware(go)) {
        continue;
      }

      go.onScreenSizeChanged(width, height);
    }
  }
}
