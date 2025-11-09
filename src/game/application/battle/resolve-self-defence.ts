import { BattleDomainState, PlannedAction } from "@game/domain";
import { PresentationEffect } from "..";

/**
 * actionType: SelfDefence の行動について、DomainEvent と PresentationEffect に解決する
 *
 * @param action 行動内容(actionType: SelfDefence)
 * @returns どうかけば良いのか
 */
export function createEffectsFromSelfDefence(currentState: Readonly<BattleDomainState>, action: Readonly<PlannedAction>)
  : {
    state: Readonly<BattleDomainState>,
    effects: ReadonlyArray<PresentationEffect>,
  } {
  const effects: PresentationEffect[] = [];
  const sourceId = action.actorId;

  effects.push(
    // 画面クリア
    { kind: "ClearMessageWindowText" },
    // 状態反映
    { kind: "ApplyState", state: currentState },
    // 「${actorId}は　みをまもっている！」を表示
    { kind: "ShowSelfDefenceText", actorId: sourceId },
  );

  return { state: currentState, effects };
}
