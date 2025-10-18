import { BaseBattleSceneState } from "../battle-scene-state";
import { BattleSceneContext } from "..";
import { BattleScene } from "../..";

/**
 * バトルシーン状態: 演出実行
 * AtomicEffect ごとに演出を実行しつつ、ViewState へ状態の反映を行なっていく
 */
export class ExecutePhasePlayActionState extends BaseBattleSceneState {
  #scene: BattleScene;

  constructor(scene: BattleScene) {
    super();
    this.#scene = scene;
  }

  override onEnter(context: BattleSceneContext) {
    super.onEnter(context);

    if (!context.turnResolution) {
      throw new Error("onEnter: BattleSceneContext.turnResolution is null");
    }

    if (context.turnResolution.atomicEffects.length === 0) {
      this.#scene.requestPopState();
    }
  }

  override update() {
    // ここで AtomicEffect の適用と適用後の状態をログ出力する
    console.log("ExecutePhasePlayActionState#update");
  }

  override onLeave() {
    // 次のターンに備えてクリアする
    this.context.commandChoices = [];
    this.context.turnPlan = undefined;
    this.context.turnResolution = undefined;
  }
}
