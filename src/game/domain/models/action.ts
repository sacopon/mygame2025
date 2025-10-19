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
  | {
    kind: "group";
    groupId: EnemyGroupId;
  }
  | {
    kind: "none";
  };

export type TargetMode =
  | {
    kind: "single";
    targetId: ActorId;
  }
  | {
    kind: "group";
    groupId: EnemyGroupId;
  }
  | {
    kind: "all";
  }
  | {
    kind: "none";
  };

export type Action = {
  /** 誰が */
  actorId: ActorId;
  /** 何をした */
  actionType: ActionType;
  /** 対象陣営 */
  side: TargetSide;
  /** 選択された対象 */
  selection: TargetSelection;
};

export type PlannedAction = Action & {
  /** 選択された対象と行動内容(装備/使用呪文/使用アイテム)から導き出された
      攻撃の当たり方と選択された具体的な対象 */
  mode: TargetMode;
};

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
export const isNoneMode = (m: TargetMode): m is Extract<TargetMode, { kind: "node" }> => m.kind === "none";

