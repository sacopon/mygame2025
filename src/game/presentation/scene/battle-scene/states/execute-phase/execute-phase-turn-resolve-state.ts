import { BattleScene } from "../../battle-scene";
import { BaseBattleSceneState, BattleSceneContext } from "..";
import { Action, DomainEvent } from "@game/domain";

type AtomicEffect = {
  "kind": "Damage",
};

type Patch = {
  event: DomainEvent;
  effects: AtomicEffect;
};

/**
 * バトルシーン状態: ターン解決
 * Action を元に、状態に反映可能な DomainEvent を生成する
 */
export class ExecutePhaseTurnResolveState extends BaseBattleSceneState {
  #scene: BattleScene;

  constructor(scene: BattleScene) {
    super();
    this.#scene = scene;
  }

  override onEnter(context: BattleSceneContext) {
    super.onEnter(context);
    console.log("ExecutePhaseTurnResolveState#onEnter");

    if (!context.turnPlan) {
      throw new Error("onEnter: BattleSceneContext.turnPlan is null");
    }

    const resolve = (_: ReadonlyArray<Action>) => { console.log("resolve"); }; // ドメイン層のアクション解決メソッド
    resolve(context.turnPlan.allActions);

    // this.#scene.requestPushState(new ExecutePhasePlayActionState(this.#scene));

    // ExecutePhase 終了時に Action と併せて空にする
    // context.commandChoices = [];
    // context.allActorActions = [];
  }
}
