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

export type Action = {
  /** 誰が */
  actorId: ActorId;
  /** 何をした */
  actionType: ActionType;
  /** 誰に/どのグループに */
  target: ActionTarget | null;
};
