import { ActorId, ActorType, AllyId, EnemyId } from "./actor";
import { Hp } from "./status-value-objects";

export type ActorStateBase = {
  actorId: ActorId;
  hp: Hp;
}

export type AllyActorSstae = ActorStateBase & {
  actorType: typeof ActorType.Ally;
  originId: AllyId;
}

export type EnemyActorState = ActorStateBase & {
  actorType: typeof ActorType.Enemy;
  originId: EnemyId;
}

export type ActorState = AllyActorSstae | EnemyActorState;

export class BattleDomainState {
  #actorStateByActorId: Map<ActorId, ActorState>;

  constructor(/*初期アクターを受け取る、アクターからBattleActorを生成する、生成者は BattleScene*/) {
    this.#actorStateByActorId = new Map<ActorId, ActorState>();
  }
}
