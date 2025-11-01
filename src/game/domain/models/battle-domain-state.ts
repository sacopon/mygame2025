import { assertNever } from "@shared/utils";
import { ActorId, ActorType, AllyActor, AllyId, EnemyActor, EnemyId } from "./actor";
import { DamageApplied, DomainEvent, SelfDefence } from "./domain-event";
import { Attack, Damage, Defence, Hp } from "./status-value-objects";

export type ActorStateBase = {
  actorId: ActorId;
  currentHp: Readonly<Hp>;
  currentAttack: Readonly<Attack>;
  currentDefence: Readonly<Defence>;
  defending: Readonly<boolean>;
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

export const isAlive = (s: ActorState): boolean => s.currentHp.isAlive;
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
        currentHp: Hp.of(ally.hp),
        currentAttack: Attack.of(ally.attack),
        currentDefence: Defence.of(ally.defence),
        defending: false,
      });
    }

    for (const enemy of enemies) {
      stateMap.set(enemy.actorId, {
        actorId: enemy.actorId,
        originId: enemy.originId,
        actorType: ActorType.Enemy,
        currentHp: Hp.of(enemy.hp),
        currentAttack: Attack.of(enemy.attack),
        currentDefence: Defence.of(enemy.defence),
        defending: false,
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
        return this.#applySelfDefence(event);

      default:
        return assertNever(event);
    }
  }

  clearDefending(): Readonly<BattleDomainState> {
    const nextStateMap = new Map(this.#actorStateByActorId);

    for (const state of this.getActorStates()) {
      nextStateMap.set(state.actorId, { ...state, defending: false });
    }

    return new BattleDomainState(nextStateMap);
  }

  /**
   * 指定アクターの状態を取得します
   */
  getActorState(actorId: Readonly<ActorId>): Readonly<ActorState> {
    const state = this.#actorStateByActorId.get(actorId);
    if (!state) { throw new Error(`invalid actorId:${actorId}`); };

    return state;
  }

  /**
   * 全アクターの状態を配列として取得します。
   */
  getActorStates(): ReadonlyArray<ActorState> {
    return Array.from(this.#actorStateByActorId.values());
  }

  /**
   * プレイヤー側のアクターの状態を配列として取得します。
   */
  getAllyActorStates(): ReadonlyArray<AllyActorState> {
    return this.getActorStates().filter(s => isAllyState(s));
  }

  /**
   * 生存しているプレイヤー側のアクターの状態を配列として取得します。
   */
  getAliveAllyActorStates(): ReadonlyArray<AllyActorState> {
    return this.getActorStates().filter(s => isAllyState(s)).filter(isAlive);
  }

  /**
   * 生存しているプレイヤー側のアクターのIDを配列として取得します。
   */
  getAliveAllyActorIds(): ReadonlyArray<ActorId> {
    return this.getAliveAllyActorStates().map(state => state.actorId);
  }

  /**
   * 敵側のアクターの状態を配列として取得します。
   */
  getEnemyActorStates(): ReadonlyArray<EnemyActorState> {
    return this.getActorStates().filter(s => !isAllyState(s));
  }

  /**
   * 生存している敵側のアクターの状態を配列として取得します。
   */
  getAliveEnemyActorIds(): ReadonlyArray<ActorId> {
    return this.getEnemyActorStates().filter(isAlive).map(state => state.actorId);
  }

  isAlive(actorId: ActorId): boolean {
    const actorState = this.#actorStateByActorId.get(actorId);

    if (!actorState) {
      throw new Error(`invalid actorId: ${actorId}`);
    }

    return isAlive(actorState);
  }

  isDead(actorId: ActorId): boolean {
    return !this.isAlive(actorId);
  }

  #applyDamage(damageEvent: DamageApplied): Readonly<BattleDomainState> {
    const actorState = this.#actorStateByActorId.get(damageEvent.targetId);

    if (!actorState) {
      throw new Error(`invalid targetId: ${damageEvent.targetId}`);
    }

    const nextStateMap = new Map(this.#actorStateByActorId);
    nextStateMap.set(actorState.actorId, { ...actorState, currentHp: actorState.currentHp.takeDamage(Damage.of(damageEvent.amount)) });
    return new BattleDomainState(nextStateMap);
  }

  #applySelfDefence(defenceEvent: SelfDefence): Readonly<BattleDomainState> {
    const actorState = this.#actorStateByActorId.get(defenceEvent.sourceId);

    if (!actorState) {
      throw new Error(`invalid sourceId: ${defenceEvent.sourceId}`);
    }

    const nextStateMap = new Map(this.#actorStateByActorId);
    nextStateMap.set(actorState.actorId, { ...actorState, defending: true });
    return new BattleDomainState(nextStateMap);
  }

  debugDump(): void {
    const data = Array.from(this.#actorStateByActorId.values()).map(actor => ({
      ...actor,
      currentHp: actor.currentHp.value,
      currentAttack: actor.currentAttack.value,
      currentDefence: actor.currentDefence.value,
    }));

    console.table(data);
  }
}
