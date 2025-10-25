import { GameObjectAccess, UiPorts } from "../scene/core/scene";
import { isScreenSizeAware } from "./game-component";
import { GameObject } from "./game-object";
import { SceneManager } from "../scene/core";
import { Ally, AllyId, DomainPorts, Enemy, EnemyId, Hp, Level } from "@game/domain";
import { AllyRepositoryInMemory, EnemyRepositoryInMemory } from "@game/infrastructure";

const createDomainPorts = function(): DomainPorts {
  const allAllyCharacters: Ally[] = [
    { allyId: AllyId(1), name: "あああああ", level: Level.of(3),  maxHp: Hp.of(80),  currentHp: Hp.of(80) },
    { allyId: AllyId(2), name: "いいいいい", level: Level.of(10), maxHp: Hp.of(130), currentHp: Hp.of(130) },
    { allyId: AllyId(3), name: "ううううう", level: Level.of(6),  maxHp: Hp.of(60),  currentHp: Hp.of(60) },
    { allyId: AllyId(4), name: "えええええ", level: Level.of(2),  maxHp: Hp.of(35),  currentHp: Hp.of(35) },
  ] as const;

const allEnemies: Enemy[] = [
  { enemyId: EnemyId(1), name: "スライム", baseHp: Hp.of(20) },
  { enemyId: EnemyId(2), name: "おおねずみ", baseHp: Hp.of(35) },
  { enemyId: EnemyId(3), name: "ビッグベアー", baseHp: Hp.of(80) },
  { enemyId: EnemyId(4), name: "パンプキン", baseHp: Hp.of(30) },
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

    // 画面サイズ変更を購読
    this.#unsubscribeScreen = screen.onGameSizeChanged(_ => {
      this.onScreenSizeChanged();
    });

    // シーンコンテキスト作成
    const sceneContext = {
      ui: ports,
      domain: createDomainPorts(),
      gameObjectAccess: this,
    };

    // シーンマネージャ作成
    this.#sceneManager = new SceneManager("Battle", sceneContext);
    this.onScreenSizeChanged();
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
  onScreenSizeChanged() {
    for (const go of this.#objects) {
      if (!go.isAlive) {
        continue;
      }

      if (!isScreenSizeAware(go)) {
        continue;
      }

      go.onScreenSizeChanged();
    }
  }
}
