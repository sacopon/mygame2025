import { BaseBattleSceneState } from "../battle-scene-state";
import { BattleScene, BattleSceneContext, CommandChoice } from "../..";
import { InputPhaseSelectCommandState } from "./input-phase-select-command-state";
import { ExecutePhaseTurnPlanningState } from "..";

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

    if (context.inputUi) {
      throw new Error("InputPhaseFlowState: inputUi already exists.");
    }

    this.scene.buildInputUi();
    this.#resetCommandChoices();
    this.#startOrNextActor();
  }

  override onLeave() {
    this.scene.disposeInputUi();
  }

  get #progressIndex(): number {
    return this.context.commandChoices.length;
  }

  #startOrNextActor(): void {
    // 全員行動確定 -> 実行フェーズへ遷移
    if (this.#isAllConfirmed()) {
      if (__DEV__) console.table(this.context.commandChoices.map(c => ({ ...c, targetJson: JSON.stringify(c.target) })));
      this.scene.requestReplaceTopState(new ExecutePhaseTurnPlanningState(this.scene));
      return;
    }

    const inputUi = this.context.inputUi!;
    const state = new InputPhaseSelectCommandState(
      this.scene,
      inputUi.commandSelectWindow,
      this.scene.getCurrentActor(this.#progressIndex),
      {
        // 決定可能か
        canDecide: _ => true,
        // 決定(確定)時処理
        onDecide: c => { this.#addChoice(c); this.#startOrNextActor(); },
        // キャンセル可能か
        canCancel: _ => 0 < this.#progressIndex,
        // キャンセル時処理
        onCancel: _ => {
          if (this.#progressIndex === 0) {
            return;
          }
          this.#undoChoice();
          this.#startOrNextActor();
        },
      });

    this.scene.requestPushState(state);
  }

  /**
   * コマンド選択の結果を追加
   */
  #addChoice(c: CommandChoice): void {
    this.context.commandChoices = [...this.context.commandChoices, c];
  }

  /**
   * コマンド選択の結果を1つ戻す
   */
  #undoChoice(): void {
    this.context.commandChoices = this.context.commandChoices.slice(0, -1);
  }

  /**
   * コマンド選択の結果をクリア
   * 実行フェーズの完了時に呼び出す
   */
  #resetCommandChoices(): void {
    this.context.commandChoices = [];
  }

  #isAllConfirmed(): boolean {
    return this.scene.getPartyCharacterCount() <= this.#progressIndex;
  }
}
