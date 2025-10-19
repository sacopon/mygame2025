import { BattleScene } from "../../battle-scene";
import { ExecutePhasePlayActionState } from "./execute-phase-play-action-state";
import { BaseBattleSceneState } from "..";
import { planTurnOrder, resolveActions } from "@game/application";
import { BattleSceneContext } from "../battle-scene-state";
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

    // 行動順の確定
    const orderedActions = planTurnOrder(context.turnPlan.plannedAllActions);

    // バトル処理
    const { events, effects } = resolveActions(orderedActions, {
      isAlly: (actorId: ActorId) => this.scene.getActorById(actorId).actorType === ActorType.Ally,
      aliveEnemiesInGroup: (groupId: EnemyGroupId) => { return this.scene.getAliveEnemiesInGroup(groupId); },
      aliveAllActors: () => this.scene.getAliveAllActors(),
    });

    this.context.turnResolution = {
      orderedActions,
      domainEvents: events,
      atomicEffects: effects,
    } satisfies BattleSceneContext["turnResolution"];

    this.scene.requestReplaceTopState(new ExecutePhasePlayActionState(this.scene));
  }
}
