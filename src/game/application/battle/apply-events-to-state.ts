import { BattleDomainState, DomainEvent } from "@game/domain";

export function applyEventsToState(currentState: Readonly<BattleDomainState>, events: ReadonlyArray<DomainEvent>): Readonly<BattleDomainState> {
  return events.reduce((state, event) => state.apply(event), currentState);
}
