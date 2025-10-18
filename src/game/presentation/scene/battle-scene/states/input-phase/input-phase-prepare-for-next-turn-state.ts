import { BaseBattleSceneState, BattleSceneContext } from "../battle-scene-state";

export class InputPhasePrepareForNextTurnState extends BaseBattleSceneState {
  #callback: () => void;

  constructor(callback: () => void) {
    super();
    this.#callback = callback;
  }

  override onEnter(context: BattleSceneContext) {
    super.onEnter(context);
    this.#callback();
  }
}
