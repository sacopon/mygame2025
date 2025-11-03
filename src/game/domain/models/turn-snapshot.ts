import { ActorId } from "./actor";
import { TurnAgility } from "./turn-agility";

/**
 * ターン中の一時的な、かつ固定された値
 */
export type TurnSnapshot = {
  agilityByActorId: Readonly<Map<ActorId, TurnAgility>>;
  defendingActorIds: Readonly<Set<ActorId>>;
};
