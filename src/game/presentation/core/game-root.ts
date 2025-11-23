import { GameObjectAccess, UiPorts } from "../scene/core/scene";
import { isScreenSizeAware } from "./game-component";
import { GameObject } from "./game-object";
import { SceneManager } from "../scene/core";
import { Agility, Ally, AllyId, Attack, Defence, DomainPorts, Enemy, EnemyId, Hp, Level, Spell, SpellId, SpellPower } from "@game/domain";
import { AllyRepositoryInMemory, EnemyRepositoryInMemory } from "@game/infrastructure";
import { EncounterRepositoryInMemory } from "@game/infrastructure/repository/encounter";
import { SpellRepositoryInMemory } from "@game/infrastructure/repository/spell";

const createDomainPorts = function(): DomainPorts {
  const allAllyCharacters: Ally[] = [
    { allyId: AllyId(1), name: "あああああ", level: Level.of(3), spellIds: [SpellId(1), SpellId(2), SpellId(3), SpellId(4), SpellId(5), SpellId(6), SpellId(7), SpellId(8), SpellId(9)],
      maxHp: Hp.of(80), currentHp: Hp.of(80), attack: Attack.of(20), defence: Defence.of(10), agility: Agility.of(15) },
    { allyId: AllyId(2), name: "いいいいい", level: Level.of(10), spellIds: [SpellId(2)],
      maxHp: Hp.of(130), currentHp: Hp.of(130), attack: Attack.of(30), defence: Defence.of(10), agility: Agility.of(10) },
    { allyId: AllyId(3), name: "ううううう", level: Level.of(6), spellIds: [SpellId(1), SpellId(3)],
      maxHp: Hp.of(60),  currentHp: Hp.of(60), attack: Attack.of(10), defence: Defence.of(10), agility: Agility.of(15) },
    { allyId: AllyId(4), name: "えええええ", level: Level.of(2), spellIds: [SpellId(3)],
      maxHp: Hp.of(35),  currentHp: Hp.of(35), attack: Attack.of(5), defence: Defence.of(10), agility: Agility.of(25) },
  ] as const;

  const allEnemies: Enemy[] = [
    { enemyId: EnemyId(1), name: "スライム", baseHp: Hp.of(20),
      attack: Attack.of(10), defence: Defence.of(10), agility: Agility.of(5) },
    { enemyId: EnemyId(2), name: "おおねずみ", baseHp: Hp.of(35),
      attack: Attack.of(15), defence: Defence.of(10), agility: Agility.of(5) },
    { enemyId: EnemyId(3), name: "ビッグベアー", baseHp: Hp.of(80),
      attack: Attack.of(50), defence: Defence.of(50), agility: Agility.of(0) },
    { enemyId: EnemyId(4), name: "パンプキン", baseHp: Hp.of(30),
      attack: Attack.of(40), defence: Defence.of(8), agility: Agility.of(20) },
  ] as const;

  const allSpells: Spell[] = [
    // 単体攻撃呪文
    {
      spellId: SpellId(1),
      name: "メラメラ",
      power: SpellPower.of(1),
      target: { scope: "single", side: "them", },
      type: "damage",
    },
    // グループ攻撃呪文
    {
      spellId: SpellId(2),
      name: "ギラギラ",
      power: SpellPower.of(1),
      target: { scope: "group", side: "them", },
      type: "damage",
    },
    // 単体回復呪文
    {
      spellId: SpellId(3),
      name: "ホイホイ",
      power: SpellPower.of(1),
      target: { scope: "single", side: "us", },
      type: "heal",
    },
    // 単体回復呪文
    {
      spellId: SpellId(4),
      name: "ホイホイ2",
      power: SpellPower.of(1),
      target: { scope: "single", side: "us", },
      type: "heal",
    },
    // 単体回復呪文
    {
      spellId: SpellId(5),
      name: "ホイホイ3",
      power: SpellPower.of(1),
      target: { scope: "single", side: "us", },
      type: "heal",
    },
    // 単体回復呪文
    {
      spellId: SpellId(6),
      name: "ホイホイ4",
      power: SpellPower.of(1),
      target: { scope: "single", side: "us", },
      type: "heal",
    },
    // 単体回復呪文
    {
      spellId: SpellId(7),
      name: "ホイホイ5",
      power: SpellPower.of(1),
      target: { scope: "single", side: "us", },
      type: "heal",
    },
    // 単体回復呪文
    {
      spellId: SpellId(8),
      name: "ホイホイ6",
      power: SpellPower.of(1),
      target: { scope: "single", side: "us", },
      type: "heal",
    },
    // 単体回復呪文
    {
      spellId: SpellId(9),
      name: "ホイホイ7",
      power: SpellPower.of(1),
      target: { scope: "single", side: "us", },
      type: "heal",
    },
  ] as const;

  return {
    allyRepository: new AllyRepositoryInMemory(allAllyCharacters),
    enemyRepository: new EnemyRepositoryInMemory(allEnemies),
    spellRepository: new SpellRepositoryInMemory(allSpells),
    encounterRepository: new EncounterRepositoryInMemory(),
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
