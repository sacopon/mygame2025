import { GameButton } from "@game/ports";
import { BattleCommand, BattleCommandDecider, BattleCommandNextFlow, BattleScene, CommandChoice } from "@game/scene/battle-scene";
import { BaseBattleSceneState, BattleSceneContext, BattleSceneStateSelectEnemy } from "./index.internal";
import { ActorId, findActor } from "@game/repository";
import { assertNever } from "@shared";

/**
 * バトルシーン状態: キャラクターの行動選択
 */
export class BattleSceneStateSelectCharacterCommand extends BaseBattleSceneState {
  #scene: BattleScene;
  #onDecide: (c: CommandChoice) => void;
  #actorId: ActorId;
  // シーンの遷移中など誤操作防止のためのフラグ
  #locked = false;

  constructor(scene: BattleScene, actorId: ActorId, onDecide: (c: CommandChoice) => void) {
    super();
    console.log(`${findActor(actorId).name}のコマンドを選択`);
    this.#scene = scene;
    this.#actorId = actorId;
    this.#onDecide = onDecide;
  }

  onEnter(context: BattleSceneContext): void {
    super.onEnter(context);
    this.#locked = false;
    this.#activate();
  }

  onLeave(_context: BattleSceneContext): void {
    this.#locked = false;
    this.#inactivate();
  }

  onSuspend(): void {
    this.#locked = false;
    this.#inactivate();
  }

  onResume(): void {
    this.#locked = false;
    this.#activate();
  }

  update(_deltaTime: number): void {
    if (this.#locked) {
      return;
    }

    const inp = this.context.ports.input;
    const ok = inp.pressed(GameButton.A);
    const up = inp.pressed(GameButton.Up);
    const down = inp.pressed(GameButton.Down);

    // 決定
    if (ok) {
      this.#locked = true;
      const command = this.context.commandSelectWindow.getCurrent();
      this.#runFlow(command, BattleCommandDecider.next(this.#actorId, command));
    }
    else if (up) {
      // カーソル上移動
      this.context.commandSelectWindow.selectPrev();
    }
    else if (down) {
      // カーソル下移動
      this.context.commandSelectWindow.selectNext();
    }
  }

  #runFlow(command: BattleCommand, nextFlow: BattleCommandNextFlow): void {
    // コマンド確定時の巻き戻し位置
    // 上にどれだけウィンドウが重なるかわからないので自身のところまで戻せるようにする
    const mark = this.#scene.markState();

    switch (nextFlow.kind) {
      // 即確定
      case BattleCommandDecider.FlowType.Immediate:
        this.#onConfirmCommand(command, mark);
        // // 各種選択ウィンドウのカーソル位置をリセットしておく
        // this.#resetSelectionWindows();
        // // このステートの上に乗せられたものは全て解除(この場合はないはずだが処理の統一性のためやっておく)
        // this.#scene.requestRewindTo(mark);
        // // このステート自身を取り除く
        // this.#scene.requestPopState();

        // // 確定処理
        // this.#onDecide({
        //   actorId: this.#actorId,
        //   command,
        // });
        break;

      case BattleCommandDecider.FlowType.NeedEnemyTarget:
        this.#scene.requestPushState(new BattleSceneStateSelectEnemy(
          this.#scene,
          {
            // 敵選択決定時
            onConfirm: target => {
              this.#onConfirmCommand(command, mark, target);
              // 妥当性チェック(選択できない相手を選んでいないか)
              // もし何かしらメッセージを表示するならメッセージ表示のステートを push する

              // // 各種選択ウィンドウのカーソル位置をリセットしておく
              // this.#resetSelectionWindows();
              // // このステートの上に乗せられたものは全て解除
              // this.#scene.requestRewindTo(mark);
              // // このステート自身を取り除く
              // this.#scene.requestPopState();

              // // 確定処理
              // this.#onDecide({
              //   actorId: this.#actorId,
              //   command,
              //   target,
              // });
            },
            // キャンセル時
            onCancel: () => {
              this.#scene.requestPopState();
            }
          }));
        break;

      default:
        assertNever(nextFlow.kind);
    }
  }

  // キャラクターの行動確定時
  #onConfirmCommand(command: BattleCommand, rewindMarker: number, target?: string): void {
    const choice: CommandChoice = {
      actorId: this.#actorId,
      command,
    };

    if (target) {
      choice.target = target;
    }

    // 各種選択ウィンドウのカーソル位置をリセットしておく
    this.#resetSelectionWindows();
    // このステートの上に乗せられたものは全て解除
    this.#scene.requestRewindTo(rewindMarker);
    // このステート自身を取り除く
    this.#scene.requestPopState();
    // 確定処理
    this.#onDecide(choice);
  }

  #resetSelectionWindows(): void {
    this.context.commandSelectWindow.reset();
    this.context.enemySelectWindow.reset();
  }

  #activate(): void {
    this.context.commandSelectWindow.setActive(true);
  }

  #inactivate(): void {
    this.context.commandSelectWindow.setActive(false);
  }
}
