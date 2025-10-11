import { BattleScene } from "@game/scene/battle-scene";
import { BaseBattleSceneState, BattleSceneContext } from "./index.internal";
import { GameButton } from "@game/ports";

/**
 * バトルシーン状態: 攻撃対象選択
 */
export class BattleSceneStateSelectEnemy extends BaseBattleSceneState {
  #scene: BattleScene;
  #onDecide: (t: string) => void;
  #selectedEnemy: string | null = null;

  constructor(scene: BattleScene, onDecide: (t: string) => void) {
    super();
    this.#scene = scene;
    this.#onDecide = onDecide;
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
      this.context.enemySelectWindow.select(0);
      this.#scene.requestPopState();
    }
    else if (ok) {
      // 決定
      this.#scene.requestPopState();
      this.#onDecide(this.context.enemySelectWindow.getCurrent());
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
