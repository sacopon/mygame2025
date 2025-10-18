import { ActorId, EnemyGroupId } from "..";

/**
 * アクションタイプ
 */
export const ActionType = {
  // 攻撃
  Attack: "Attack",
  // 防御
  SelfDefence: "SelfDefence",
  // 呪文
  Spell: "Spell",
  // アイテム
  Item: "Item",
} as const;
export type ActionType = typeof ActionType[keyof typeof ActionType];

/**
 * ターゲット: 単体
 */
type SingleTarget = {
  kind: "single";
  targetActorId: ActorId;
};

/**
 * ターゲット: グループ
 */
type GroupTarget = {
  kind: "group";
  targetGroupId: EnemyGroupId;
};

/**
 * ターゲット: 陣営全体
 */
type AllTarget = {
  kind: "all";
};

/**
 * ターゲット: なし/不問/不要
 */
type NoneTarget = {
  kind: "none";
};

export type ActionTarget = SingleTarget | GroupTarget | AllTarget | NoneTarget;

/**
 * ターゲットの陣営の方向
 */
export const TargetSide = {
  // 自陣営
  Us: "Us",
  // 相手陣営
  Them: "Them",
  // なし(無関係)/双方
  Neutral: "Neutral",
} as const;
export type TargetSide = typeof TargetSide[keyof typeof TargetSide];

export type Action = {
  /** 誰が */
  actorId: ActorId;
  /** 何をした */
  actionType: ActionType;
  /** 対象陣営 */
  side: TargetSide;
  /** 誰に/どのグループに */
  target: ActionTarget;
};

// creators
export const ActionTargets = {
  none: (): ActionTarget => ({ kind: "none" }),
  single: (id: ActorId): ActionTarget => ({ kind: "single", targetActorId: id }),
  group: (gid: EnemyGroupId): ActionTarget => ({ kind: "group", targetGroupId: gid }),
  all: (): ActionTarget => ({ kind: "all" }),
} as const;

// type guards
export const isSingle = (t: ActionTarget): t is Extract<ActionTarget, { kind: "single" }> => t.kind === "single";
export const isGroup  = (t: ActionTarget): t is Extract<ActionTarget, { kind: "group" }>  => t.kind === "group";
export const isAll    = (t: ActionTarget): t is Extract<ActionTarget, { kind: "all" }>    => t.kind === "all";
export const isNone   = (t: ActionTarget): t is Extract<ActionTarget, { kind: "none" }>   => t.kind === "none";
