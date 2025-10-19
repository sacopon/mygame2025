import { Action, ActionType, TargetSelections, TargetSide } from "@game/domain";
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
        side: TargetSide.Them,
        selection: TargetSelections.group(choice.target.groupId),
      };

    case BattleCommand.Defence:
      return {
        actorId: choice.actorId,
        actionType: ActionType.SelfDefence,
        side: TargetSide.Neutral,
        selection: TargetSelections.none(),
      };

    case BattleCommand.Spell:
    case BattleCommand.Item:
      // 未実装のため actionType 以外は適当
      return {
        actorId: choice.actorId,
        actionType: choice.command === BattleCommand.Spell ? ActionType.Spell : ActionType.Item,
        side: TargetSide.Neutral,
        selection: TargetSelections.none(),
      };

    default:
      assertNever(choice);
  }
}
