import { ActorId } from "../";

export type DamageApplied = {
  type: "DamageApplied";
  sourceId: ActorId;
  targetId: ActorId;
  amount: number;
  critical: boolean;
};

export type DomainEvent = DamageApplied
