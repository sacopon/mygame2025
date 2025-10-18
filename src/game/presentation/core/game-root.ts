import { GameObjectAccess, UiPorts } from "../scene/core/scene";
import { isScreenSizeAware } from "./game-component";
import { GameObject } from "./game-object";
import { SceneManager } from "../scene/core";
import { Ally, AllyId, DomainPorts, Enemy, EnemyId } from "@game/domain";
import { AllyRepositoryInMemory, EnemyRepositoryInMemory } from "@game/infrastructure";

const createDomainPorts = function(): DomainPorts {
  const allAllyCharacters: Ally[] = [
    { allyId: AllyId(1), name: "ゆうしゃ" },  // 勇者
    { allyId: AllyId(2), name: "もりそば" },  // 武闘家
    { allyId: AllyId(3), name: "うおのめ" },  // 賢者
    { allyId: AllyId(4), name: "かおる"   },  // 戦士
  ] as const;

const allEnemies: Enemy[] = [
  { enemyId: EnemyId(1), name: "スライム" },
  { enemyId: EnemyId(2), name: "スライムベス" },
  { enemyId: EnemyId(3), name: "ドラキー" },
  { enemyId: EnemyId(4), name: "まほうつかい" },
] as const;

  return {
    allyRepository: new AllyRepositoryInMemory(allAllyCharacters),
    enemyRepository: new EnemyRepositoryInMemory(allEnemies),
  };
};

/**
 * シーンとゲームオブジェクトを管理するルートとなるクラス
 */
export class GameRoot implements GameObjectAccess {
  #sceneManager: SceneManager;
  #objects: GameObject[] = [];
  #unsubscribeScreen?: () => void;

  constructor(ports: UiPorts) {
    const { screen } = ports;
    const { width, height } = screen.getGameSize();

    // 画面サイズ変更を購読
    this.#unsubscribeScreen = screen.onGameSizeChanged(size => {
      this.onScreenSizeChanged(size.width, size.height);
    });

    // シーンコンテキスト作成
    const sceneContext = {
      ui: ports,
      domain: createDomainPorts(),
      gameObjectAccess: this,
    };

    // シーンマネージャ作成
    this.#sceneManager = new SceneManager("Battle", sceneContext);
    this.onScreenSizeChanged(width, height);
  }

  spawnGameObject<T extends GameObject>(o: T): T {
    this.#objects.push(o);
    return o;
  }

  despawnGameObject<T extends GameObject>(o: T): void {
    if (!o.isAlive) {
      return;
    }

    // 破棄予約
    o.destroy();
  }

  update(deltaTime: number) {
    this.#sceneManager.update(deltaTime);

    const list = this.#objects.slice();

    for (const o of list) {
      if (o.isAlive) {
        o.update(deltaTime);
      }
    }

    const alives = [];
    for (const o of list) {
      if (o.isAlive) {
        alives.push(o);
      }
      else {
        try {
          o.onDispose();
        }
        catch (e) {
          // あと片付け中はエラーが発生しても続行
          console.warn("GameRoot#update(): onDispose is failed for", o, e);
        }
      }
    }

    this.#objects = alives;
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
      if (!go.isAlive) {
        continue;
      }

      if (!isScreenSizeAware(go)) {
        continue;
      }

      go.onScreenSizeChanged(width, height);
    }
  }
}
