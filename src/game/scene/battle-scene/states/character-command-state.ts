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

  constructor(scene: BattleScene, actorId: ActorId, onDecide: (c: CommandChoice) => void) {
    super();
    console.log(`${findActor(actorId).name}のコマンドを選択`);
    this.#scene = scene;
    this.#actorId = actorId;
    this.#onDecide = onDecide;
  }

  onEnter(context: BattleSceneContext): void {
    super.onEnter(context);
    this.#activate();
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
    const ok = inp.pressed(GameButton.A);
    const up = inp.pressed(GameButton.Up);
    const down = inp.pressed(GameButton.Down);

    // 決定
    if (ok) {
      console.log("決定");
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
    switch (nextFlow.kind) {
      case BattleCommandDecider.FlowType.Immediate:
        // 即確定
        this.context.commandSelectWindow.reset();

        // 自身のステートも取り除く
        this.#scene.requestPopState();

        this.#onDecide({
          actorId: this.#actorId,
          command,
        });
        break;

      case BattleCommandDecider.FlowType.NeedEnemyTarget:
        this.#scene.requestPushState(new BattleSceneStateSelectEnemy(
          this.#scene,
          {
            // 敵選択決定時
            onConfirm: target => {
              // 妥当性チェック(選択できない相手を選んでいないか)
              // もし何かしらメッセージを表示するならメッセージ表示のステートを push する

              this.context.commandSelectWindow.reset();
              this.context.enemySelectWindow.reset();

              // 敵選択のステートを取り除く
              this.#scene.requestPopState();
              // 自身のステートも取り除く
              this.#scene.requestPopState();

              this.#onDecide({
                actorId: this.#actorId,
                command,
                target,
              });
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

  #activate(): void {
    this.context.commandSelectWindow.setActive(true);
  }

  #inactivate(): void {
    this.context.commandSelectWindow.setActive(false);
  }
}
