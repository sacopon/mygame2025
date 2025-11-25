import { BaseBattleSceneState } from "../battle-scene-state";
import { BattleScene, BattleSceneContext } from "../..";
import { EnemyGroupId } from "@game/domain";
import { EnemySelectWindow, GameButton } from "../../../..";

export type EnemySelectEvents = {
  onTargetSelected: (target: EnemyGroupId) => void;
  onCancel: () => void;
}

/**
 * バトルシーン状態: 対象(敵)選択
 */
export class InputPhaseSelectTargetEnemyState extends BaseBattleSceneState {
  #enemySelectWindow: EnemySelectWindow;
  #callbacks: EnemySelectEvents;

  constructor(scene: BattleScene, window: EnemySelectWindow, callbacks: EnemySelectEvents) {
    super(scene);
    this.#enemySelectWindow = window;
    this.#callbacks = callbacks;
  }

  override onEnter(context: BattleSceneContext) {
    super.onEnter(context);
    this.#enemySelectWindow.setActive(true, true);
  }

  override onLeave(_context: BattleSceneContext): void {
    this.#inactivate();
  }

  override onSuspend(): void {
    this.#inactivate();
  }

  override onResume(): void {
    this.#activate();
  }

  override update(_deltaTime: number): void {
    const inp = this.context.ui.input;
    const cancel = inp.pressed(GameButton.B);
    const ok = inp.pressed(GameButton.A);
    const up = inp.pressed(GameButton.Up);
    const down = inp.pressed(GameButton.Down);

    if (cancel) {
      // キャンセル
      this.#enemySelectWindow.reset();
      // このステート自身を取り除く
      this.scene.requestPopState();
      // キャンセル処理
      this.#callbacks.onCancel();
    }
    else if (ok) {
      // 決定
      this.context.ui.audio.playSe("cursor");
      const targetGroupId = this.#enemySelectWindow.getCurrent();
      this.#callbacks.onTargetSelected(targetGroupId);
    }
    else if (up) {
      // カーソル上移動
      this.#enemySelectWindow.selectPrev();
    }
    else if (down) {
      // カーソル下移動
      this.#enemySelectWindow.selectNext();
    }
  }

  #activate(): void {
    this.#enemySelectWindow.setActive(true);
  }

  #inactivate(): void {
    this.#enemySelectWindow.setActive(false);
  }
}
