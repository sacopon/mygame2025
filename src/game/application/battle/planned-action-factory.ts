import { ActionType, ActorId, EnemyGroupId, PlannedAction } from "@game/domain";

/**
 * テンプレートから PlannedAction を作成する
 */
export const plannedActionFactory = {
  // プレイヤー側
  ally: {
    // 攻撃
    attack: {
      /**
       * 味方側単体攻撃アクションを作成する
       *
       * @param actorId 攻撃者
       * @param groupId 選択した対象敵グループ
       * @returns 単体攻撃用アクション
       */
      single(actorId: ActorId, groupId: EnemyGroupId): PlannedAction {
        return {
          actionType: ActionType.Attack,
          actorId,
          selection: { kind: "group", groupId } as const,
          mode: { kind: "single" } as const,
        } satisfies PlannedAction;
      },
      /**
       * 味方側グループ攻撃アクションを作成する
       *
       * @param actorId 攻撃者
       * @param groupId 選択した対象敵グループ
       * @returns グループ攻撃用アクション
       */
      group(actorId: ActorId, groupId: EnemyGroupId): PlannedAction {
        return {
          actionType: ActionType.Attack,
          actorId,
          selection: { kind: "group", groupId } as const,
          mode: { kind: "group", groupId } as const,
        } satisfies PlannedAction;
      },
      /**
       * 味方側全体攻撃アクションを作成する
       *
       * @param actorId 攻撃者
       * @returns 全体攻撃用アクション
       */
      all(actorId: ActorId): PlannedAction {
        return {
          actionType: ActionType.Attack,
          actorId,
          selection: { kind: "none" } as const,
          mode: { kind: "all" } as const,
        } satisfies PlannedAction;
      },
    },
  },
  // 敵側
  enemy: {
    attack: {
      /**
       * 敵側単体攻撃アクションを作成する
       *
       * @param actorId 攻撃者
       * @returns 単体攻撃用アクション
       */
      single(actorId: ActorId): PlannedAction {
        return {
          actionType: ActionType.Attack,
          actorId,
          selection: { kind: "none" } as const, // 敵は対象の選択がない
          mode: { kind: "single" } as const,
        } satisfies PlannedAction;
      },
      /**
       * 敵側全体攻撃アクションを作成する
       *
       * @param actorId 攻撃者
       * @returns 全体攻撃用アクション
       */
      all(actorId: ActorId): PlannedAction {
        return {
          actionType: ActionType.Attack,
          actorId,
          selection: { kind: "none" } as const, // 敵は対象の選択がない
          mode: { kind: "all" } as const,
        } satisfies PlannedAction;
      },
    },
  },
  // 防御(敵味方の区別なし)
  defence(actorId: ActorId): PlannedAction {
    return {
      actionType: ActionType.SelfDefence,
      actorId,
      selection: { kind: "none" } as const,
      mode: { kind: "none" } as const,
    } satisfies PlannedAction;
  },
  // 未実装のため階層なし
  spell(actorId: ActorId): PlannedAction {
    return {
      actionType: ActionType.Spell,
      actorId,
      selection: { kind: "none" } as const,
      mode: { kind: "none" } as const,
    } satisfies PlannedAction;
  },
  // 未実装のため階層なし
  item(actorId: ActorId): PlannedAction {
    return {
      actionType: ActionType.Spell,
      actorId,
      selection: { kind: "none" } as const,
      mode: { kind: "none" } as const,
    } satisfies PlannedAction;
  },
};
