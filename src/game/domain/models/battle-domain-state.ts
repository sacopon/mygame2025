import { assertNever } from "@shared/utils";
import { ActorId, ActorType, AllyActor, AllyId, EnemyActor, EnemyId } from "./actor";
import { DamageApplied, DomainEvent } from "./domain-event";
import { Damage, Hp } from "./status-value-objects";

export type ActorStateBase = {
  actorId: ActorId;
  hp: Hp;
}

export type AllyActorState = ActorStateBase & {
  actorType: Readonly<typeof ActorType.Ally>;
  originId: Readonly<AllyId>;
}

export type EnemyActorState = ActorStateBase & {
  actorType: Readonly<typeof ActorType.Enemy>;
  originId: Readonly<EnemyId>;
}

export type ActorState = AllyActorState | EnemyActorState;

const isAllyState = (s: ActorState): s is AllyActorState => s.actorType == ActorType.Ally;

export class BattleDomainState {
  #actorStateByActorId: Map<Readonly<ActorId>, Readonly<ActorState>>;

  constructor(actorStateByActorId: Map<Readonly<ActorId>, Readonly<ActorState>>) {
    this.#actorStateByActorId = new Map(actorStateByActorId);
  }

  static fromActors(allies: ReadonlyArray<AllyActor>, enemies: ReadonlyArray<EnemyActor>) {
    const stateMap = new Map<Readonly<ActorId>, Readonly<ActorState>>();

    for (const ally of allies) {
      stateMap.set(ally.actorId, {
        actorId: ally.actorId,
        originId: ally.originId,
        actorType: ActorType.Ally,
        hp: Hp.of(80),
      });
    }

    for (const enemy of enemies) {
      stateMap.set(enemy.actorId, {
        actorId: enemy.actorId,
        originId: enemy.originId,
        actorType: ActorType.Enemy,
        hp: Hp.of(80),
      });
    }

    return new BattleDomainState(stateMap);
  }

  clone(): BattleDomainState {
    return new BattleDomainState(this.#actorStateByActorId);
  }

  apply(event: DomainEvent): Readonly<BattleDomainState> {
    switch (event.type) {
      case "DamageApplied":
        return this.#applyDamage(event);

      case "SelfDefence":
        // TODO: 未実装
        return new BattleDomainState(this.#actorStateByActorId);

      default:
        return assertNever(event);
    }
  }

  /**
   * 全アクターの状態を配列として取得します。
   */
  public getActorStates(): ReadonlyArray<ActorState> {
    return Array.from(this.#actorStateByActorId.values());
  }

  /**
   * プレイヤー側のアクターの状態を配列として取得します。
   */
  public getAllyActorStates(): ReadonlyArray<AllyActorState> {
    return this.getActorStates().filter(s => isAllyState(s));
  }

  #applyDamage(damageEvent: DamageApplied): Readonly<BattleDomainState> {
    const actorState = this.#actorStateByActorId.get(damageEvent.targetId);

    if (!actorState) {
      throw new Error(`invalid targetId: ${damageEvent.targetId}`);
    }

    const nextStateMap = new Map(this.#actorStateByActorId);
    nextStateMap.set(actorState.actorId, { ...actorState, hp: actorState.hp.takeDamage(Damage.of(damageEvent.amount)) });
    return new BattleDomainState(nextStateMap);
  }

  debugDump(): void {
    const data = Array.from(this.#actorStateByActorId.values()).map(actor => ({
      ...actor,
      hp: actor.hp.value,
    }));

    console.table(data);
  }
}
