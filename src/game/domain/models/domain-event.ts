import { ActorId } from "../";

export type DamageApplied = {
  type: "DamageApplied";
  sourceId: ActorId;
  targetId: ActorId;
  amount: number;
  critical: boolean;
};

export type SelfDefence = {
  type: "SelfDefence";
  sourceId: ActorId;
};

export type DomainEvent = DamageApplied | SelfDefence;
