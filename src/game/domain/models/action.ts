import { ActorId, EnemyGroupId } from "..";
import { SpellId } from "./spell";

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

type BaseAction = Readonly<{
  /** 誰が */
  actorId: ActorId;
  /** 選択された対象 */
  selection: TargetSelection;
}>;

type AttackAction = BaseAction & Readonly<{
  /** 何をした */
  actionType: typeof ActionType.Attack;
}>;

type SelfDefenceAction = BaseAction & Readonly<{
  /** 何をした */
  actionType: typeof ActionType.SelfDefence;
}>;

type SpellAction = BaseAction & Readonly<{
  /** 何をした */
  actionType: typeof ActionType.Spell;
  /** 使った呪文 */
  spellId: SpellId;
}>;

type ItemAction = BaseAction & Readonly<{
  /** 何をした */
  actionType: typeof ActionType.Item;
}>;

export type Action =
  | AttackAction
  | SelfDefenceAction
  | SpellAction
  | ItemAction;

// 味方キャラクタ用単体攻撃
type AttackActionSingleForAlly = Readonly<{
  actionType: typeof ActionType.Attack;
  actorId: ActorId;
  selection: { kind: "group"; groupId: EnemyGroupId; };
  mode: { kind: "single"; targetId?: ActorId; };
}>;

// 敵キャラクタ用単体攻撃
type AttackActionSingleForEnemy = Readonly<{
  actionType: typeof ActionType.Attack;
  actorId: ActorId;
  selection: { kind: "none"; };
  mode: { kind: "single"; targetId?: ActorId; };
}>;

// グループ攻撃(味方キャラクタ専用)
type AttackActionGroup = Readonly<{
  actionType: typeof ActionType.Attack;
  actorId: ActorId;
  selection: { kind: "group"; groupId: EnemyGroupId; };
  mode: { kind: "group"; groupId: EnemyGroupId; };
}>;

// 全体攻撃
type AttackActionAll = Readonly<{
  actionType: typeof ActionType.Attack;
  actorId: ActorId;
  selection: { kind: "none"; };
  mode: { kind: "all"; };
}>;

// ターゲットなし
type AttackActionNone = Readonly<{
  actionType: typeof ActionType.Attack;
  actorId: ActorId;
  selection: { kind: "none"; };
  mode: { kind: "none"; };
}>;

type SelfDefenceActionNone = Readonly<{
  actionType: typeof ActionType.SelfDefence;
  actorId: ActorId;
  selection: { kind: "none"; };
  mode: { kind: "none"; };
}>;

export type SpellPlannedAction = Readonly<{
  actionType: typeof ActionType.Spell;
  actorId: ActorId;
  spellId: SpellId;
  selection: TargetSelection;
  mode: TargetMode;
}>;

type ItemActionNone = Readonly<{
  actionType: typeof ActionType.Item;
  actorId: ActorId;
  selection: { kind: "none"; };
  mode: { kind: "none"; };
}>;

export type PlannedAction =
  | AttackActionSingleForAlly
  | AttackActionSingleForEnemy
  | AttackActionGroup
  | AttackActionAll
  | AttackActionNone
  | SelfDefenceActionNone
  | SpellPlannedAction
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

