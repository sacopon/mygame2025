import { BattleScene } from "../../battle-scene";
import { BaseBattleSceneState, BattleSceneContext } from "..";
import { convertCommandChoiceToAction, createEnemyActions } from "@game/application";
import { Action } from "@game/domain";
import { ExecutePhaseTurnResolveState } from "./execute-phase-turn-resolve-state";

/**
 * バトルシーン状態: ターン実行計画策定
 * 入力済みの CommandState を Action 配列に変換するだけのステート
 * 乱数は使わず、行動順の決定は次の ExecutePhaseTurnResolveState で行う
 */
export class ExecutePhaseTurnPlanningState extends BaseBattleSceneState {
  #scene: BattleScene;

  constructor(scene: BattleScene) {
    super();
    this.#scene = scene;
  }

  override onEnter(context: BattleSceneContext) {
    super.onEnter(context);

    const commands = context.commandChoices;
    const allyActions = commands.map(convertCommandChoiceToAction);
    const enemyActions: Action[] = createEnemyActions({
      allyActorOrder: context.allyActorIds,
      enemyActorIds: context.enemyActorIds,
    });
    context.turnPlan = {
      allyActions,
      enemyActions,
      allActions: [...allyActions, ...enemyActions],
    };

    this.#scene.requestReplaceTopState(new ExecutePhaseTurnResolveState(this.#scene));
  }
}
