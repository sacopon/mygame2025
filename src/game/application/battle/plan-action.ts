import { plannedActionFactory } from "./planned-action-factory";
import { Action, ActionType, ActorId, PlannedAction } from "@game/domain";
import { assertNever } from "@shared/utils";

export function planAction(action: Readonly<Action>, isAlly: (actorId: ActorId) => boolean): Readonly<PlannedAction> {
  const isAllyAction = isAlly(action.actorId);

  switch (action.actionType) {
    case ActionType.Attack:
      if (isAllyAction) {
        // 現在は味方の攻撃は単体 or 全体のみ
        // TODO: actorId の装備を見て決める
        // TODO: グループ攻撃対応
        return action.selection.kind === "group"
          ? plannedActionFactory.ally.attack.single(action.actorId, action.selection.groupId)
          : plannedActionFactory.ally.attack.all(action.actorId);
      }

      // 敵側は今のところ単体攻撃固定
      // TODO: 敵の特殊攻撃の内容を見て決める
      return plannedActionFactory.enemy.attack.single(action.actorId);

    case ActionType.SelfDefence:
      return plannedActionFactory.defence(action.actorId);

    case ActionType.Spell:
      // TODO: 一旦単体攻撃に限定
      if (isAllyAction) {
        if (action.selection.kind !== "group") {
          throw new Error("Ally offensive spell requires group target selection.");
        }

        return plannedActionFactory.ally.spell.them.single(action.actorId, action.spellId, action.selection.groupId);
      }
      else {
        return plannedActionFactory.enemy.spell.them.single(action.actorId, action.spellId);
      }

    case ActionType.Item:
      // TODO: 未実装なので形だけ
      return plannedActionFactory.item(action.actorId);

    default:
      assertNever(action);
  }
}
