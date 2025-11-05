import { BaseBattleSceneState } from "../battle-scene-state";
import { InputPhaseSelectTargetEnemyState } from "./input-phase-select-target-enemy-state";
import { BattleCommand, BattleCommandDecider, BattleCommandNextFlow, BattleScene, BattleSceneContext, CommandChoice } from "../..";
import { assertNever } from "@shared";
import { AllyActor, SpellId } from "@game/domain";
import { GameButton } from "@game/presentation/ports";
import { CommandSelectWindow, EnemySelectWindow } from "@game/presentation/game-object";
import { InputPhaseNoticeMessageState } from "./input-phase-notice-message-state";

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
  #callbacks: InputPhaseCallbacks;
  #actor: AllyActor;
  // コマンド入力ウィンドウ
  #commandSelectWindow: CommandSelectWindow;
  // シーンの遷移中など誤操作防止のためのフラグ
  #locked = false;

  constructor(
    scene: BattleScene,
    window: CommandSelectWindow,
    actor: AllyActor,
    callbacks: InputPhaseCallbacks
  ) {
    super(scene);
    this.#commandSelectWindow = window;
    this.#actor = actor;
    this.#callbacks = callbacks;
  }

  override onEnter(context: BattleSceneContext): void {
    super.onEnter(context);
    this.#locked = false;
    this.#activate();

    // ウィンドウにキャラクター名を反映
    this.#commandSelectWindow.setActorName(context.domain.allyRepository.findAlly(this.#actor.originId).name);
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

    const inp = this.context.ui.input;
    const ok = inp.pressed(GameButton.A);
    const cancel = inp.pressed(GameButton.B);
    const up = inp.pressed(GameButton.Up);
    const down = inp.pressed(GameButton.Down);

    // 決定
    if (ok) {
      this.#locked = true;
      this.context.ui.audio.playSe("cursor");
      const command = this.#commandSelectWindow.getCurrent();
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
      this.#commandSelectWindow.reset();
      // このステート自身を取り除く
      this.scene.requestPopState();
      // キャンセル処理
      this.#callbacks.onCancel(this.#actor);
    }
    else if (up) {
      // カーソル上移動
      this.#commandSelectWindow.selectPrev();
    }
    else if (down) {
      // カーソル下移動
      this.#commandSelectWindow.selectNext();
    }
  }

  get #enemySelectWindow(): EnemySelectWindow {
    return this.context.inputUi!.enemySelectWindow;
  }

  #runFlow(command: BattleCommand, nextFlow: BattleCommandNextFlow): void {
    // コマンド確定時の巻き戻し位置
    // 上にどれだけウィンドウが重なるかわからないので自身のところまで戻せるようにする
    const mark = this.scene.markState();

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
        this.scene.requestPushState(new InputPhaseSelectTargetEnemyState(
          this.scene,
          this.context.inputUi!.enemySelectWindow,
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
              else if (command === BattleCommand.Spell) {
                // TODO: 本来このケースは存在しないので、呪文選択ウィンドウを実装するまでの一時的な処理
                const choice: Extract<CommandChoice, { command: typeof BattleCommand.Spell }> = {
                  actorId: this.#actor.actorId,
                  command,
                  spellId: SpellId(1),
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
              this.scene.requestPopState();
            }
          }));
        break;

      case BattleCommandDecider.FlowType.NotImplement:
        this.#commandSelectWindow.setToDeactiveColor();
        this.context.inputUi?.enemySelectWindow.setToDeactiveColor();
        this.scene.requestPushState(new InputPhaseNoticeMessageState(
          this.scene,
          "そのコマンドは　まだ実装されていない！",
          () => {
            this.#commandSelectWindow.setToActiveColor();
            this.context.inputUi?.enemySelectWindow.setToActiveColor();
            this.scene.requestPopState();
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
    this.scene.requestRewindTo(rewindMarker);
    // このステート自身を取り除く
    this.scene.requestPopState();
    // 確定処理
    this.#callbacks.onDecide(command);
  }

  #resetSelectionWindows(): void {
    this.#commandSelectWindow.reset();
    this.#enemySelectWindow.reset();
  }

  #activate(): void {
    this.#commandSelectWindow.setActive(true);
  }

  #inactivate(): void {
    this.#commandSelectWindow.setActive(false);
  }
}
