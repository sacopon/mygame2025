import { AtomicEffect } from "..";
import { Action, DomainEvent } from "@game/domain";

/**
 * Action を(ドメイン処理を用いて)解決し、DomainEffect と AtomicEffect を生成する
 */
export function resolveActions(_actions: ReadonlyArray<Action>)
  : {
    events: readonly DomainEvent[],
    effects: readonly AtomicEffect[],
  } {
  return { events: [], effects: [] };
}
