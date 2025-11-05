import { ActionType, ActorId, EnemyGroupId, PlannedAction, SpellId } from "@game/domain";

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
    // 呪文
    spell: {
      // 回復呪文、バフなど
      us: {
        /**
        * プレイヤー側の味方単体対象呪文アクションを作成する
        *
        * @param actorId 呪文使用者
        * @param spellId 呪文ID
        * @param targetId 選択した味方
        * @returns プレイヤー単体呪文アクション
        */
        single(actorId: ActorId, spellId: SpellId, targetId: ActorId): PlannedAction {
          return {
            actionType: ActionType.Spell,
            actorId,
            spellId,
            selection: { kind: "none" } as const,
            mode: { kind: "single", targetId } as const,
          } satisfies PlannedAction;
        },
        /**
         * プレイヤー側全体対象呪文アクションを作成する
         *
         * @param actorId 攻撃者
         * @param spellId 呪文ID
         * @returns プレイヤー全体対象呪文アクション
         */
        all(actorId: ActorId, spellId: SpellId): PlannedAction {
          return {
            actionType: ActionType.Spell,
            actorId,
            spellId,
            selection: { kind: "none" } as const,
            mode: { kind: "all" } as const,
          } satisfies PlannedAction;
        },
        // 味方グループ対象の呪文は存在しない
      },
      // 攻撃呪文、デバフなど
      them: {
        /**
        * プレイヤー側の敵単体対象呪文アクションを作成する
        *
        * @param actorId 呪文使用者
        * @param spellId 呪文ID
        * @param groupId 選択した敵グループ
        * @returns 敵単体対象呪文アクション
        */
        single(actorId: ActorId, spellId: SpellId, groupId: EnemyGroupId): PlannedAction {
          return {
            actionType: ActionType.Spell,
            actorId,
            spellId,
            selection: { kind: "group", groupId } as const,
            mode: { kind: "single" } as const,
          } satisfies PlannedAction;
        },
        /**
         * プレイヤー側の敵グループ対象呪文アクションを作成する
         *
         * @param actorId 呪文使用者
         * @param spellId 呪文ID
         * @param groupId 選択した敵グループ
         * @returns 敵グループ対象呪文アクション
         */
        group(actorId: ActorId, spellId: SpellId, groupId: EnemyGroupId): PlannedAction {
          return {
            actionType: ActionType.Spell,
            actorId,
            spellId,
            selection: { kind: "group", groupId } as const,
            mode: { kind: "group", groupId } as const,
          } satisfies PlannedAction;
        },
        /**
         * プレイヤー側の敵全体対象呪文アクションを作成する
         *
         * @param actorId 呪文使用者
         * @param spellId 呪文ID
         * @returns 敵全体対象呪文アクション
         */
        all(actorId: ActorId, spellId: SpellId): PlannedAction {
          return {
            actionType: ActionType.Spell,
            actorId,
            spellId,
            selection: { kind: "none" } as const,
            mode: { kind: "all" } as const,
          } satisfies PlannedAction;
        },
      }
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
    // 呪文
    spell: {
      // 回復呪文、バフなど
      us: {
        /**
        * 敵側の味方単体対象呪文アクションを作成する
        *
        * @param actorId 呪文使用者
        * @param targetId 選択した味方
         * @returns 敵単体対象の呪文アクション
        */
        single(actorId: ActorId, spellId: SpellId, targetId: ActorId): PlannedAction {
          return {
            actionType: ActionType.Spell,
            actorId,
            spellId,
            selection: { kind: "none" } as const,
            mode: { kind: "single", targetId } as const,
          } satisfies PlannedAction;
        },
        /**
         * 敵側の味方全体対象呪文アクションを作成する
         *
         * @param actorId 攻撃者
         * @returns 敵全体対象の呪文アクション
         */
        all(actorId: ActorId, spellId: SpellId): PlannedAction {
          return {
            actionType: ActionType.Spell,
            actorId,
            spellId,
            selection: { kind: "none" } as const,
            mode: { kind: "all" } as const,
          } satisfies PlannedAction;
        },
        // 味方グループ対象の呪文は存在しない
      },
      // 攻撃呪文、デバフなど
      them: {
        /**
        * 敵側のプレイヤー単体対象呪文アクションを作成する
        *
        * @param actorId 呪文使用者
        * @param spellId 呪文ID
        * @returns プレイヤー単体呪文アクション
        */
        single(actorId: ActorId, spellId: SpellId): PlannedAction {
          return {
            actionType: ActionType.Spell,
            actorId,
            spellId,
            selection: { kind: "none" } as const,
            mode: { kind: "single" } as const,
          } satisfies PlannedAction;
        },
        // プレイヤーグループ対象の呪文はない(プレイヤー側に対しては全体のみ)
        /**
         * 敵側のプレイヤー全体対象呪文アクションを作成する
         *
         * @param actorId 呪文使用者
         * @param groupId 選択した敵グループ
         * @returns プレイヤー全体対象呪文アクション
         */
        all(actorId: ActorId, spellId: SpellId): PlannedAction {
          return {
            actionType: ActionType.Spell,
            actorId,
            spellId,
            selection: { kind: "none" } as const,
            mode: { kind: "all" } as const,
          } satisfies PlannedAction;
        },
      }
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
  item(actorId: ActorId): PlannedAction {
    return {
      actionType: ActionType.Item,
      actorId,
      selection: { kind: "none" } as const,
      mode: { kind: "none" } as const,
    } satisfies PlannedAction;
  },
};
