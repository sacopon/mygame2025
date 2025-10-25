import { ActorId, ActorType, AllyActor, AllyId, EnemyActor, EnemyId } from "./actor";
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

  constructor(allies: ReadonlyArray<AllyActor>, enemies: ReadonlyArray<EnemyActor>) {
    this.#actorStateByActorId = new Map<ActorId, ActorState>();

    for (const ally of allies) {
      this.#actorStateByActorId.set(ally.actorId, {
        actorId: ally.actorId,
        originId: ally.originId,
        actorType: ActorType.Ally,
        hp: Hp.of(999),
      });
    }

    for (const enemy of enemies) {
      this.#actorStateByActorId.set(enemy.actorId, {
        actorId: enemy.actorId,
        originId: enemy.originId,
        actorType: ActorType.Enemy,
        hp: Hp.of(999),
      });
    }
  }

  debugDump(): void {
    const data = Array.from(this.#actorStateByActorId.values()).map(actor => ({
      ...actor,
      hp: actor.hp.value,
    }));

    console.table(data);
  }
}
