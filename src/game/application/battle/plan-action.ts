import { plannedActionFactory } from "./planned-action-factory";
import { Action, ActionType, ActorId, PlannedAction, Spell, SpellId } from "@game/domain";
import { assertNever } from "@shared";

export function planAction(action: Readonly<Action>, isAlly: (actorId: ActorId) => boolean, getSpell: (id: SpellId) => Readonly<Spell>): Readonly<PlannedAction> {
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
      const spell = getSpell(action.spellId);

      if (isAllyAction) {
        if (spell.target.side === "them") {
          // 相手にかける呪文
          if (action.selection.kind !== "group") {
            // 相手全体はまだ未実装
            throw new Error("Ally offensive spell requires group target selection.");
          }

          if (spell.target.kind === "single") {
            return plannedActionFactory.ally.spell.them.single(action.actorId, action.spellId, action.selection.groupId);
          }
          else if (spell.target.kind === "group") {
            return plannedActionFactory.ally.spell.them.group(action.actorId, action.spellId, action.selection.groupId);
          }
          else {
            throw new Error("Not Implement");
          }
        }
        else if (spell.target.side === "us") {
          // 味方にかける呪文
          if (action.selection.kind === "ally") {
            // 味方単体
            return plannedActionFactory.ally.spell.us.single(action.actorId, action.spellId, action.selection.actorId);
          }
          else {
            // 味方全体
            throw new Error("Not Implement");
          }
        }
        else {
          throw new Error("Not Implement");
        }
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
