import { BattleScene } from "../../battle-scene";
import { BaseBattleSceneState, BattleSceneContext } from "..";
import { convertCommandChoiceToAction, createEnemyActions, planAction } from "@game/application";
import { Action, ActorId, ActorType } from "@game/domain";
import { ExecutePhaseTurnResolveState } from "./execute-phase-turn-resolve-state";

/**
 * バトルシーン状態: ターン実行計画策定
 * 入力済みの CommandState を Action 配列に変換するだけのステート
 * 乱数は使わず、行動順の決定は次の ExecutePhaseTurnResolveState で行う
 */
export class ExecutePhaseTurnPlanningState extends BaseBattleSceneState {
  constructor(scene: BattleScene) {
    super(scene);
  }

  override onEnter(context: BattleSceneContext) {
    super.onEnter(context);

    // 選択されたコマンドから暫定の Action を作成する
    const commands = context.commandChoices;
    const allyActions = commands.map(convertCommandChoiceToAction);

    // 敵の分の Action も作成する
    const enemyActions: Action[] = createEnemyActions({
      allyActorOrder: context.allyActorIds,
      enemyActorIds: context.enemyActorIds,
    });

    // Action の TargetMode を埋める
    // (行動計画の具体的な対象はまだ決定しない)
    const allActions = [...allyActions, ...enemyActions];
    const plannedAllActions = allActions
      .map(action => planAction(
        action,
        (actorId: ActorId) => this.scene.getActorById(actorId).actorType === ActorType.Ally));

    context.turnPlan = {
      allyActions,
      enemyActions,
      plannedAllActions,
    };

    this.scene.requestReplaceTopState(new ExecutePhaseTurnResolveState(this.scene));
  }
}
