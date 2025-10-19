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

/**
 * CommandChoice からマッピングされるターゲット選択
 * この値と Action の内容から実際の攻撃対象(単体/グループ/全体)を設定することになる
 */
export type TargetSelection =
  | { kind: "group"; groupId: EnemyGroupId; }
  | { kind: "none"; };

export type TargetMode =
  | { kind: "single"; targetId?: ActorId; } // 計画時に決まることもあれば、行動直前に決まることもある
  | { kind: "group"; groupId: EnemyGroupId; }
  | { kind: "all"; }
  | { kind: "none"; };

export type Action = {
  /** 誰が */
  actorId: ActorId;
  /** 何をした */
  actionType: ActionType;
  // /** 対象陣営 */
  // side: TargetSide;
  /** 選択された対象 */
  selection: TargetSelection;
};

// 味方キャラクタ用単体攻撃
type AttackActionSingleForAlly = {
  actionType: typeof ActionType.Attack;
  actorId: ActorId;
  selection: { kind: "group"; groupId: EnemyGroupId; };
  mode: { kind: "single"; targetId?: ActorId; };
};

// 敵キャラクタ用単体攻撃
type AttackActionSingleForEnemy = {
  actionType: typeof ActionType.Attack;
  actorId: ActorId;
  selection: { kind: "none"; };
  mode: { kind: "single"; targetId?: ActorId; };
};

// グループ攻撃(味方キャラクタ専用)
type AttackActionGroup = {
  actionType: typeof ActionType.Attack;
  actorId: ActorId;
  selection: { kind: "group"; groupId: EnemyGroupId; };
  mode: { kind: "group"; groupId: EnemyGroupId; };
};

// 全体攻撃
type AttackActionAll = {
  actionType: typeof ActionType.Attack;
  actorId: ActorId;
  selection: { kind: "none"; };
  mode: { kind: "all"; };
};

// ターゲットなし
type AttackActionNone = {
  actionType: typeof ActionType.Attack;
  actorId: ActorId;
  selection: { kind: "none"; };
  mode: { kind: "none"; };
};

type SelfDefenceActionNone = {
  actionType: typeof ActionType.SelfDefence;
  actorId: ActorId;
  selection: { kind: "none"; };
  mode: { kind: "none"; };
};

// TODO: 未実装のため NONE だけ用意
type SpellActionNone = {
  actionType: typeof ActionType.Spell;
  actorId: ActorId;
  selection: { kind: "none"; };
  mode: { kind: "none"; };
};

type ItemActionNone = {
  actionType: typeof ActionType.Item;
  actorId: ActorId;
  selection: { kind: "none"; };
  mode: { kind: "none"; };
};

export type PlannedAction =
  | AttackActionSingleForAlly
  | AttackActionSingleForEnemy
  | AttackActionGroup
  | AttackActionAll
  | AttackActionNone
  | SelfDefenceActionNone
  | SpellActionNone
  | ItemActionNone;

// creators
export const TargetSelections = {
  none: (): TargetSelection => ({ kind: "none" } as const),
  group: (gid: EnemyGroupId): TargetSelection => ({ kind: "group", groupId: gid } as const),
} as const;

// type guards
export const isGroup  = (t: TargetSelection): t is Extract<TargetSelection, { kind: "group" }>  => t.kind === "group";
export const isNone   = (t: TargetSelection): t is Extract<TargetSelection, { kind: "none" }>   => t.kind === "none";

export const isAttack = (a: Action) => a.actionType === ActionType.Attack;
export const isSingleMode = (m: TargetMode): m is Extract<TargetMode, { kind: "single" }> => m.kind === "single";
export const isGroupMode = (m: TargetMode): m is Extract<TargetMode, { kind: "group" }> => m.kind === "group";
export const isAllMode = (m: TargetMode): m is Extract<TargetMode, { kind: "all" }> => m.kind === "all";
export const isNoneMode = (m: TargetMode): m is Extract<TargetMode, { kind: "none" }> => m.kind === "none";

