import { BaseBattleSceneState, BattleSceneContext } from "../battle-scene-state";
import { BattleScene } from "../..";

/**
 * 入力フェーズの基本ステート
 * 入力フェーズ中のサブステートの遷移は全てこのステートの上に乗る形で行われる
 * 入力フェーズから出る場合はこのステートを replace で置き換える
 */
export class InputPhaseFlowState extends BaseBattleSceneState {
  constructor(scene: BattleScene) {
    super(scene);
  }

  override onEnter(context: BattleSceneContext) {
    super.onEnter(context);
    this.scene.beginInputPhase();
  }
}
