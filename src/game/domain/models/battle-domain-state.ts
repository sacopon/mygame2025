import { assertNever } from "@shared";
import { ActorId, ActorType, AllyActor, AllyId, EnemyActor, EnemyId } from "./actor";
import { DamageApplied, DomainEvent, HealApplied } from "./domain-event";
import { Agility, Attack, Defence, Hp, Mp } from "./status-value-objects";
import { Damage } from "./damage";
import { HealAmount } from "./heal-amount";

export type ActorStateBase = {
  actorId: ActorId;
  currentHp: Hp;
  maxHp: Hp;
  currentAttack: Attack;
  currentDefence: Defence;
  currentAgility: Agility;
}

export type AllyActorState = ActorStateBase & {
  actorType: typeof ActorType.Ally;
  originId: AllyId;
  currentMp: Mp;
}

export type EnemyActorState = ActorStateBase & {
  actorType: typeof ActorType.Enemy;
  originId: EnemyId;
}

export type ActorState = AllyActorState | EnemyActorState;

export const isAlive = (s: ActorState): boolean => s.currentHp.isAlive;
export const isAllyState = (s: ActorState): s is AllyActorState => s.actorType == ActorType.Ally;

export class BattleDomainState {
  #actorStateByActorId: Map<ActorId, Readonly<ActorState>>;

  constructor(actorStateByActorId: Map<ActorId, Readonly<ActorState>>) {
    this.#actorStateByActorId = new Map(actorStateByActorId);
  }

  static fromActors(allies: ReadonlyArray<AllyActor>, enemies: ReadonlyArray<EnemyActor>) {
    const stateMap = new Map<ActorId, Readonly<ActorState>>();

    for (const ally of allies) {
      stateMap.set(ally.actorId, {
        actorId: ally.actorId,
        originId: ally.originId,
        actorType: ActorType.Ally,
        currentHp: Hp.of(ally.hp),
        maxHp: Hp.of(ally.maxHp),
        currentMp: Mp.of(ally.mp),
        currentAttack: Attack.of(ally.attack),
        currentDefence: Defence.of(ally.defence),
        currentAgility: Agility.of(ally.agility),
      });
    }

    for (const enemy of enemies) {
      stateMap.set(enemy.actorId, {
        actorId: enemy.actorId,
        originId: enemy.originId,
        actorType: ActorType.Enemy,
        currentHp: Hp.of(enemy.hp),
        maxHp: Hp.of(enemy.hp), // 敵のHPは常に最大状態から始まるので
        currentAttack: Attack.of(enemy.attack),
        currentDefence: Defence.of(enemy.defence),
        currentAgility: Agility.of(enemy.agility),
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

      case "HealApplied":
        return this.#applyHeal(event);

      case "SelfDefence":
        // ターンの先頭で TurnSnapshot として防御フラグを立てているので、特に適用する状態はなし
        return this;

      default:
        return assertNever(event);
    }
  }

  /**
   * 指定アクターの状態を取得します
   */
  getActorState(actorId: ActorId): Readonly<ActorState> {
    const state = this.#actorStateByActorId.get(actorId);
    if (!state) { throw new Error(`invalid actorId:${actorId}`); };

    return state;
  }

  /**
   * 指定アクター(味方)の状態を取得します
   */
  getAllyActorState(actorId: ActorId): Readonly<AllyActorState> {
    const state = this.#actorStateByActorId.get(actorId);
    if (!state) { throw new Error(`invalid actorId:${actorId}`); };
    if (!isAllyState(state)) { throw new Error(`actorId:${actorId} is not ally`); }

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
    nextStateMap.set(
      actorState.actorId,
      {
        ...actorState,
        currentHp: actorState.currentHp.takeDamage(Damage.of(damageEvent.amount)),
      }
    );
    return new BattleDomainState(nextStateMap);
  }

  #applyHeal(recoverEvent: HealApplied): Readonly<BattleDomainState> {
    const actorState = this.#actorStateByActorId.get(recoverEvent.targetId);

    if (!actorState) {
      throw new Error(`invalid targetId: ${recoverEvent.targetId}`);
    }

    const nextStateMap = new Map(this.#actorStateByActorId);
    nextStateMap.set(
      actorState.actorId,
      {
        ...actorState,
        currentHp: actorState.currentHp.heal(HealAmount.of(recoverEvent.amount), actorState.maxHp),
      }
    );
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
