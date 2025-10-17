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

export type ActionTarget = SingleTarget | GroupTarget;

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
};
export type TargetSide = typeof TargetSide[keyof typeof TargetSide];

export type Action = {
  /** 誰が */
  actorId: ActorId;
  /** 何をした */
  actionType: ActionType;
  /** 対象陣営 */
  side: TargetSide;
  /** 誰に/どのグループに */
  target: ActionTarget | null;
};
