import { SpellId } from "./spell";
import { Agility, Attack, Defence, Hp, Level } from "./status-value-objects";
import { Brand } from "@shared";

// 味方キャラクター内での一意なID
export type AllyId = Brand<number, "AllyId">;
// 敵キャラクター内での一意なID
export type EnemyId = Brand<number, "EnemyId">;
// (敵味方問わず)バトルに参加する全キャラクターに一意のID. バトルの開始時に割り振られる
export type ActorId = Brand<number, "ActorId">;
// バトルに参加する敵をグループ化するためのID. 敵選択はこの単位で行われる. バトルの開始時に割り振られる
export type EnemyGroupId = Brand<number, "EnemyGroupId">;

// 安全に作成するためのヘルパ
export const AllyId = (n: number) => n as AllyId;
export const EnemyId = (n: number) => n as EnemyId;
export const ActorId = (n: number) => n as ActorId;
export const EnemyGroupId = (n: number) => n as EnemyGroupId;

// 敵か味方か
export const ActorType = {
  Ally: "Ally",   // 味方
  Enemy: "Enemy", // 敵
} as const;
export type ActorType = typeof ActorType[keyof typeof ActorType];

/**
 * 味方のキャラクター情報
 */
export type Ally = {
  allyId: AllyId;
  name: Readonly<string>;
  level: Level;
  spellIds: ReadonlyArray<SpellId>,
  maxHp: Hp;
  currentHp: Hp;
  attack: Attack;
  defence: Defence;
  agility: Agility;
}

// Actor(味方キャラクター)の定義
// バトル中のパラメータを持つ
export type AllyActor = {
  actorId: ActorId;
  actorType: typeof ActorType.Ally;
  originId: AllyId;
  name: Readonly<string>;
  level: Level;
  spellIds: ReadonlyArray<SpellId>,
  hp: Hp;
  maxHp: Hp;
  attack: Attack;
  defence: Defence;
  agility: Agility;
};

/**
 * 敵モンスターの情報
 */
export type Enemy = {
  enemyId: EnemyId;
  name: Readonly<string>;
  baseHp: Hp;
  attack: Attack;
  defence: Defence;
  agility: Agility;
}

// Actor(敵キャラクター)の定義
export type EnemyActor = {
  actorId: ActorId;
  enemyGroupId: EnemyGroupId;
  actorType: typeof ActorType.Enemy;
  originId: EnemyId;
  name: Readonly<string>;
  hp: Hp;
  attack: Attack;
  defence: Defence;
  agility: Agility;
};

export type Actor = AllyActor | EnemyActor;

export function createAllyActor(ally: Ally, actorId: ActorId): AllyActor {
  return {
    actorId,
    actorType: ActorType.Ally,
    originId: ally.allyId,
    name: ally.name,
    level: Level.of(ally.level),
    spellIds: ally.spellIds.slice(),
    hp: Hp.of(ally.currentHp),
    maxHp: Hp.of(ally.maxHp),
    attack: Attack.of(ally.attack),
    defence: Defence.of(ally.defence),
    agility: Agility.of(ally.agility),
  };
}

export function createEnemyActor(enemy: Enemy, actorId: ActorId, groupId: EnemyGroupId): EnemyActor {
  return {
    actorId,
    actorType: ActorType.Enemy,
    originId: enemy.enemyId,
    enemyGroupId: groupId,
    name: enemy.name,
    hp: Hp.of(enemy.baseHp),
    attack: Attack.of(enemy.attack),
    defence: Defence.of(enemy.defence),
    agility: Agility.of(enemy.agility),
  };
}
