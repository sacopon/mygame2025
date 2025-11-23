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
          switch (spell.target.scope) {
            case "single":
              if (action.selection.kind !== "group") { throw new Error("単体攻撃呪文なのに敵グループが選択されていない"); }
              return plannedActionFactory.ally.spell.them.single(action.actorId, action.spellId, action.selection.groupId);

            case "group":
              if (action.selection.kind !== "group") { throw new Error("グループ攻撃呪文なのに敵グループが選択されていない"); }
              return plannedActionFactory.ally.spell.them.group(action.actorId, action.spellId, action.selection.groupId);

            case "all":
              if (action.selection.kind !== "none") { throw new Error("全体攻撃呪文なのに敵グループが選択されている"); }
              return plannedActionFactory.ally.spell.them.all(action.actorId, action.spellId);

            default:
              assertNever(spell.target.scope);
          }
        }
        else if (spell.target.side === "us") {
          // 味方にかける呪文
          switch (spell.target.scope) {
            case "single":
              if (action.selection.kind !== "ally") { throw new Error("味方単体の呪文なのにキャラが選択されていない"); }
              return plannedActionFactory.ally.spell.us.single(action.actorId, action.spellId, action.selection.actorId);

            case "all":
              if (action.selection.kind !== "none") { throw new Error("味方全体の呪文なのにキャラが選択されている"); }
              return plannedActionFactory.ally.spell.us.all(action.actorId, action.spellId);

            case "group":
              throw new Error("味方対象のグループ呪文は存在しない");

            default:
              assertNever(spell.target.scope);
          }
        }
        else {
          assertNever(spell.target.side);
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
