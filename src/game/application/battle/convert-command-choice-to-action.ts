import { Action, ActionType, TargetSelections } from "@game/domain";
import { BattleCommand, CommandChoice } from "@game/presentation";
import { assertNever } from "@shared/utils";

/**
 * Presentation 層で生成された CommandChoice を Doain 層で使用する Action に変換する
 * UI非依存・ドメイン知識は使うがモデルには属さない
 */
export function convertCommandChoiceToAction(choice: CommandChoice): Action {
  switch (choice.command) {
    case BattleCommand.Attack:
      return {
        actorId: choice.actorId,
        actionType: ActionType.Attack,
        selection: TargetSelections.group(choice.target.groupId),
      };

    case BattleCommand.Defence:
      return {
        actorId: choice.actorId,
        actionType: ActionType.SelfDefence,
        selection: TargetSelections.none(),
      };

    case BattleCommand.Spell:
      if (choice.target!.kind !== "enemyGroup") {
        throw new Error("Not implement");
      }

      return {
        actorId: choice.actorId,
        actionType: ActionType.Spell,
        spellId: choice.spellId,
        selection: TargetSelections.group(choice.target!.groupId),
      };

    case BattleCommand.Item:
      // 未実装のため actionType 以外は適当
      return {
        actorId: choice.actorId,
        actionType: ActionType.Item,
        selection: TargetSelections.none(),
      };

    default:
      assertNever(choice);
  }
}
