type Brand<T, B extends string> = T & { readonly __brand: B };

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

// Actor(味方キャラクター)の定義
// バトル中のパラメータを持つ
export type AllyActor = {
  actorId: ActorId;
  actorType: typeof ActorType.Ally;
  originId: AllyId;
  // 現在のHPなど...
  // 詳細部分やバトル開始前のベース部分となる値は Ally に定義
};

/**
 * 味方のキャラクター情報
 */
export type Ally = {
  allyId: AllyId;
  name: string;
  // バトル開始前の各種パラメータなどを追加
}

// Actor(敵キャラクター)の定義
export type EnemyActor = {
  actorId: ActorId;
  enemyGroupId: EnemyGroupId;
  actorType: typeof ActorType.Enemy;
  originId: EnemyId;
  // 現在のHPなど...
  // 詳細部分や全個体のベースとなる値は Enemy に定義
};

/**
 * 敵モンスターの情報
 */
export type Enemy = {
  enemyId: EnemyId;
  name: string;
  // 各種パラメータなどを追加
}

export type Actor = AllyActor | EnemyActor;
