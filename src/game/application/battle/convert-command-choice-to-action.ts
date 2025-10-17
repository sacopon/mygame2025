import { Action, ActorId } from "@game/domain";
import { CommandChoice } from "@game/presentation";

/**
 * Presentation 層で生成された CommandChoice を Doain 層で使用する Action に変換する
 * UI非依存・ドメイン知識は使うがモデルには属さない
 */
export function convertCommandChoiceToAction(_command: CommandChoice): Action {
  return {
    actorId: ActorId(0),
    actionType: "Attack",
    target: {
      kind: "single",
      targetActorId: ActorId(0),
    },
  };
}
