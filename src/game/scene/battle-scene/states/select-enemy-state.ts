import { BaseBattleSceneState, BattleSceneContext } from "./battle-scene-state";
import { BattleScene } from "..";
import { GameButton } from "@game/ports";

export type EnemySelectEvents = {
  onConfirm: (target: string) => void;
  onCancel: () => void;
}

/**
 * バトルシーン状態: 攻撃対象選択
 */
export class BattleSceneStateSelectEnemy extends BaseBattleSceneState {
  #scene: BattleScene;
  #selectedEnemy: string | null = null;
  #callbacks;

  constructor(scene: BattleScene, callbacks: EnemySelectEvents) {
    super();
    this.#scene = scene;
    this.#callbacks = callbacks;
  }

  onEnter(context: BattleSceneContext) {
    super.onEnter(context);
    context.enemySelectWindow.setActive(true);
  }

  onLeave(_context: BattleSceneContext): void {
    this.#inactivate();
  }

  onSuspend(): void {
    this.#inactivate();
  }

  onResume(): void {
    this.#activate();
  }

  update(_deltaTime: number): void {
    const inp = this.context.ports.input;
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
      const target = this.context.enemySelectWindow.getCurrent();
      this.#callbacks.onConfirm(target);
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
