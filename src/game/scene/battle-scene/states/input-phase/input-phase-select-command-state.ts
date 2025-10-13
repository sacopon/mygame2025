import { BaseBattleSceneState, BattleSceneContext } from "../battle-scene-state";
import { InputPhaseSelectTargetEnemyState } from "./input-phase-select-target-enemy-state";
import { BattleCommand, BattleCommandDecider, BattleCommandNextFlow, BattleScene, CommandChoice } from "../..";
import { assertNever } from "@shared";
import { AllyActor } from "@game/domain";
import { GameButton } from "@game/ports";
import { findAlly } from "@game/repository";

export type InputPhaseCallbacks = {
  onDecide: (c: CommandChoice) => void,
  canDecide: (c: CommandChoice) => boolean,
  onCancel: (actor: AllyActor) => void,
  canCancel: (actor: AllyActor) => boolean,
}

/**
 * バトルシーン状態: キャラクターの行動選択
 */
export class InputPhaseSelectCommandState extends BaseBattleSceneState {
  #scene: BattleScene;
  #callbacks: InputPhaseCallbacks;
  #actor: AllyActor;
  // シーンの遷移中など誤操作防止のためのフラグ
  #locked = false;

  constructor(
    scene: BattleScene,
    actor: AllyActor,
    callbacks: InputPhaseCallbacks
  ) {
    super();
    this.#scene = scene;
    this.#actor = actor;
    this.#callbacks = callbacks;
  }

  override onEnter(context: BattleSceneContext): void {
    super.onEnter(context);
    this.#locked = false;
    this.#activate();

    // ウィンドウにキャラクター名を反映
    context.commandSelectWindow.setActorName(findAlly(this.#actor.originId).name);
  }

  override onLeave(_context: BattleSceneContext): void {
    this.#locked = false;
    this.#inactivate();
  }

  override onSuspend(): void {
    this.#locked = false;
    this.#inactivate();
  }

  override onResume(): void {
    this.#locked = false;
    this.#activate();
  }

  override update(_deltaTime: number): void {
    if (this.#locked) {
      return;
    }

    const inp = this.context.ports.input;
    const ok = inp.pressed(GameButton.A);
    const cancel = inp.pressed(GameButton.B);
    const up = inp.pressed(GameButton.Up);
    const down = inp.pressed(GameButton.Down);

    // 決定
    if (ok) {
      this.#locked = true;
      const command = this.context.commandSelectWindow.getCurrent();
      this.#runFlow(command, BattleCommandDecider.next(this.#actor.actorId, command));
    }
    // キャンセル
    else if (cancel) {
      this.#locked = true;

      if (!this.#callbacks.canCancel(this.#actor)) {
        this.#locked = false;
        return;
      }

      // 各種選択ウィンドウのカーソル位置をリセットしておく
      this.context.commandSelectWindow.reset();
      // このステート自身を取り除く
      this.#scene.requestPopState();
      // キャンセル処理
      this.#callbacks.onCancel(this.#actor);
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
        if (command === BattleCommand.Defence) {
          this.#onConfirmCommand(
            {
              actorId: this.#actor.actorId,
              command,
            },
            mark);
        }
        break;

      case BattleCommandDecider.FlowType.NeedEnemyTarget:
        this.#scene.requestPushState(new InputPhaseSelectTargetEnemyState(
          this.#scene,
          {
            // 敵選択決定時
            onConfirm: targetGroupId => {
              if (command === BattleCommand.Attack) {
                const choice: Extract<CommandChoice, { command: typeof BattleCommand.Attack }> = {
                  actorId: this.#actor.actorId,
                  command,
                  target: {
                    kind: "enemyGroup",
                    groupId: targetGroupId,
                  },
                };

                // 妥当性チェック(選択できない相手を選んでいないか)
                if (!this.#callbacks.canDecide(choice)) {
                  // もし何かしらメッセージを表示するならメッセージ表示のステートを push する
                }

                // 確定処理
                this.#onConfirmCommand(choice, mark);
              }
            },
            // 敵選択キャンセル時
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
  #onConfirmCommand(command: CommandChoice, rewindMarker: number): void {
    // 各種選択ウィンドウのカーソル位置をリセットしておく
    this.#resetSelectionWindows();
    // このステートの上に乗せられたものは全て解除
    this.#scene.requestRewindTo(rewindMarker);
    // このステート自身を取り除く
    this.#scene.requestPopState();
    // 確定処理
    this.#callbacks.onDecide(command);
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
