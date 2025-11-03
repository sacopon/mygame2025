import { BattleScene } from "../../battle-scene";
import { ExecutePhasePlayActionState } from "./execute-phase-play-action-state";
import { BaseBattleSceneState } from "..";
import { BattleSceneContext } from "../..";
import { buildTurnSnapshot, planTurnOrder, resolveActions } from "@game/application";
import { ActorId, ActorType, EnemyGroupId } from "@game/domain";

/**
 * バトルシーン状態: ターン解決
 * Action を元に、状態に反映可能な DomainEvent を生成する
 * 完了時に BattleState をターン終わりの状態に更新する
 */
export class ExecutePhaseTurnResolveState extends BaseBattleSceneState {
  constructor(scene: BattleScene) {
    super(scene);
  }

  override onEnter(context: BattleSceneContext) {
    super.onEnter(context);

    if (!context.turnPlan) {
      throw new Error("onEnter: BattleSceneContext.turnPlan is null");
    }

    // ターンのスナップショットを作成
    // このターンでの素早さを確定
    const turnSnapshot = buildTurnSnapshot(
      context.domainState,
      context.turnPlan.plannedAllActions,
      { random: context.ui.random });

    // 行動順の確定
    const orderedActions = planTurnOrder(context.turnPlan.plannedAllActions, turnSnapshot);

    // バトル処理
    const { state, effects } = resolveActions(context.domainState, turnSnapshot, orderedActions, {
      random: this.context.ui.random,
      getActor: (actorId: ActorId) => this.scene.getActorById(actorId),
      isAlly: (actorId: ActorId) => this.scene.getActorById(actorId).actorType === ActorType.Ally,
      aliveAllAllies: () => this.scene.getAliveAllies(),
      aliveAllEnemies: () => this.scene.getAliveEnemies(),
      getActorIdsByEnemyGroup: (groupId: EnemyGroupId) => this.scene.getActorIdsByEnemyGroup(groupId),
      aliveAllActors: () => this.scene.getAliveAllActors(),
    });

    // 生成された解決済みアクションをバトル状態に反映する
    context.nextDomainState = state;

    this.context.turnResolution = {
      orderedActions,
      atomicEffects: effects,
    } satisfies BattleSceneContext["turnResolution"];

    this.scene.requestReplaceTopState(new ExecutePhasePlayActionState(this.scene));
  }
}
