import { assertNever } from "@shared";
import { PresentationEffect } from "..";
import {
  ActionType,
  BattleDomainState,
  PlannedAction,
  TurnSnapshot
} from "@game/domain";
import { ResolveDeps } from "./resolve-types";
import { createAttackResolution } from "./resolve-attack";
import { createEffectsFromSelfDefence } from "./resolve-self-defence";
import { createSpellResolution } from "./resolve-spell";

/**
 * Action を(ドメイン処理を用いて)解決し、DomainEvent と PresentationEffect を生成する
 *
 * @param actions 行動内容の配列
 * @returns ドメインイベントとアトミックイベントそれぞれの配列
 */
export function resolveActions(
  state: Readonly<BattleDomainState>,
  turn: Readonly<TurnSnapshot>,
  actions: ReadonlyArray<PlannedAction>,
  deps: ResolveDeps
) : {
  state: Readonly<BattleDomainState>,
  effects: ReadonlyArray<PresentationEffect>,
} {
  const resultEffects: PresentationEffect[] = [];
  let currentState = state;

  for (const action of actions) {
    // 死んでいるキャラクターの Action は無視
    if (currentState.isDead(action.actorId)) {
      continue;
    }

    const { state: nextState, effects } = resolveAction(currentState, turn, action, deps);
    currentState = nextState;
    resultEffects.push(...effects);
  }

  return { state: currentState, effects: resultEffects };
}

/**
 * 1件の Action を処理し、対応する DomainEvent と PresentationEffect 列を作り出す
 *
 * @param action 行動内容
 * @returns どうかけば良いのか
 */
function resolveAction(currentState: Readonly<BattleDomainState>, turn: Readonly<TurnSnapshot>, action: Readonly<PlannedAction>, deps: ResolveDeps)
  : {
    state: Readonly<BattleDomainState>,
    effects: ReadonlyArray<PresentationEffect>,
  } {
  switch(action.actionType) {
    case ActionType.Attack:
      return createAttackResolution(currentState, turn, action, deps);

    case ActionType.SelfDefence:
      return createEffectsFromSelfDefence(currentState, action);

    case ActionType.Spell:
      return createSpellResolution(currentState, turn, action, deps);

    case ActionType.Item:
      throw new Error("Not Implement");

    default:
      assertNever(action);
  }
}
