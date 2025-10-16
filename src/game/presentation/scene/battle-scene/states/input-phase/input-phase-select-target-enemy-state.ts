import { BaseBattleSceneState, BattleSceneContext } from "../battle-scene-state";
import { BattleScene } from "../..";
import { GameButton } from "@game/presentation/ports";
import { EnemyGroupId } from "@game/domain";

export type EnemySelectEvents = {
  onConfirm: (target: EnemyGroupId) => void;
  onCancel: () => void;
}

/**
 * バトルシーン状態: 対象(敵)選択
 */
export class InputPhaseSelectTargetEnemyState extends BaseBattleSceneState {
  #scene: BattleScene;
  #selectedEnemy: string | null = null;
  #callbacks;

  constructor(scene: BattleScene, callbacks: EnemySelectEvents) {
    super();
    this.#scene = scene;
    this.#callbacks = callbacks;
  }

  override onEnter(context: BattleSceneContext) {
    super.onEnter(context);
    context.enemySelectWindow.setActive(true);
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
      this.context.enemySelectWindow.reset();
      this.#callbacks.onCancel();
    }
    else if (ok) {
      // 決定
      const targetGroupId = this.context.enemySelectWindow.getCurrent();
      this.#callbacks.onConfirm(targetGroupId);
    }
    else if (up) {
      // カーソル上移動
      this.context.enemySelectWindow.selectPrev();
    }
    else if (down) {
      // カーソル下移動
      this.context.enemySelectWindow.selectNext();
    }
  }

  #activate(): void {
    this.context.enemySelectWindow.setActive(true);
  }

  #inactivate(): void {
    this.context.enemySelectWindow.setActive(false);
  }
}
