import { BaseBattleSceneState, BattleSceneContext } from "../../states/battle-scene-state";
import { AllyActor } from "@game/domain";
import { BattleScene, InputPhaseCallbacks } from "../..";
import { GameButton, SpellSelectWindow } from "../../../..";

/**
 * バトルシーン状態: 呪文選択
 */
export class InputPhaseSelectSpellState extends BaseBattleSceneState {
  #callbacks: InputPhaseCallbacks;
  #actor: AllyActor;
  // 呪文選択ウィンドウ
  #spellSelectWindow: SpellSelectWindow;
  // シーンの遷移中など誤操作防止のためのフラグ
  #locked = false;

  constructor(
    scene: BattleScene,
    window: SpellSelectWindow,
    actor: AllyActor,
    callbacks: InputPhaseCallbacks
  ) {
    super(scene);
    this.#spellSelectWindow = window;
    this.#actor = actor;
    this.#callbacks = callbacks;
  }

  override onEnter(context: BattleSceneContext): void {
    super.onEnter(context);
    this.#locked = false;
    this.#activate();

    // コマンド選択/敵選択ウィンドウを非アクティブにする
    context.inputUi!.commandSelectWindow.setActive(false);
    context.inputUi!.enemySelectWindow.setActive(false, true);  // ウィンドウカラーも非アクティブ色に

    // 呪文の一覧をウィンドウに設定する
    this.#spellSelectWindow.setSpells(this.#actor.spellIds.map(s => context.domain.spellRepository.findSpell(s)));

    // ウィンドウにキャラクター名を反映
    this.#spellSelectWindow.setActorName(context.domain.allyRepository.findAlly(this.#actor.originId).name);
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
      // const command = this.#spellSelectWindow.getCurrent();
      // this.#runFlow(command, BattleCommandDecider.next(this.#actor.actorId, command));
    }
    // キャンセル
    else if (cancel) {
      this.#locked = true;

      if (!this.#callbacks.canCancel(this.#actor)) {
        this.#locked = false;
        return;
      }

      // 各種選択ウィンドウのカーソル位置をリセットしておく
      this.#spellSelectWindow.reset();
      // このステート自身を取り除く
      this.scene.requestPopState();
      // キャンセル処理
      this.#callbacks.onCancel(this.#actor);
    }
    else if (up) {
      // カーソル上移動
      this.#spellSelectWindow.selectPrev();
    }
    else if (down) {
      // カーソル下移動
      this.#spellSelectWindow.selectNext();
    }
  }

  // get #enemySelectWindow(): EnemySelectWindow {
  //   return this.context.inputUi!.enemySelectWindow;
  // }

  // #runFlow(command: BattleCommand, nextFlow: BattleCommandNextFlow): void {
  //   // コマンド確定時の巻き戻し位置
  //   // 上にどれだけウィンドウが重なるかわからないので自身のところまで戻せるようにする
  //   const mark = this.scene.markState();

  //   switch (nextFlow.kind) {
  //     // 即確定
  //     case BattleCommandDecider.FlowType.Immediate:
  //       if (command === BattleCommand.Defence) {
  //         this.#onConfirmCommand(
  //           {
  //             actorId: this.#actor.actorId,
  //             command,
  //           },
  //           mark);
  //       }
  //       break;

  //     case BattleCommandDecider.FlowType.NeedEnemyTarget:
  //       this.scene.requestPushState(new InputPhaseSelectTargetEnemyState(
  //         this.scene,
  //         this.context.inputUi!.enemySelectWindow,
  //         {
  //           // 敵選択決定時
  //           onConfirm: targetGroupId => {
  //             if (command === BattleCommand.Attack) {
  //               const choice: Extract<CommandChoice, { command: typeof BattleCommand.Attack }> = {
  //                 actorId: this.#actor.actorId,
  //                 command,
  //                 target: {
  //                   kind: "enemyGroup",
  //                   groupId: targetGroupId,
  //                 },
  //               };

  //               // 妥当性チェック(選択できない相手を選んでいないか)
  //               if (!this.#callbacks.canDecide(choice)) {
  //                 // もし何かしらメッセージを表示するならメッセージ表示のステートを push する
  //               }

  //               // 確定処理
  //               this.#onConfirmCommand(choice, mark);
  //             }
  //             else if (command === BattleCommand.Spell) {
  //               // TODO: 本来このケースは存在しないので、呪文選択ウィンドウを実装するまでの一時的な処理
  //               const spellId = SpellId(1 + ((this.#actor.actorId - 1) % 3)); // 1 = メラ、2 = ギラ、3 = ホイミ
  //               const choice: Extract<CommandChoice, { command: typeof BattleCommand.Spell }> = {
  //                 actorId: this.#actor.actorId,
  //                 command,
  //                 spellId,
  //                 target: spellId === 1 || spellId === 2 ? {
  //                   kind: "enemyGroup",
  //                   groupId: targetGroupId,
  //                 } : {
  //                   kind: "ally",
  //                   actorId: ActorId(4),//this.scene.getAliveAllies()[0],
  //                 },
  //               };

  //               // 妥当性チェック(選択できない相手を選んでいないか)
  //               if (!this.#callbacks.canDecide(choice)) {
  //                 // もし何かしらメッセージを表示するならメッセージ表示のステートを push する
  //               }

  //               // 確定処理
  //               this.#onConfirmCommand(choice, mark);
  //             }
  //           },
  //           // 敵選択キャンセル時
  //           onCancel: () => {
  //             this.scene.requestPopState();
  //           }
  //         }));
  //       break;

  //     case BattleCommandDecider.FlowType.NeedSpellSelect:
  //       // 呪文選択のステートへ遷移する
  //       break;

  //     case BattleCommandDecider.FlowType.NotImplement:
  //       this.#spellSelectWindow.setToDeactiveColor();
  //       this.context.inputUi?.enemySelectWindow.setToDeactiveColor();
  //       this.scene.requestPushState(new InputPhaseNoticeMessageState(
  //         this.scene,
  //         "そのコマンドは　まだ実装されていない！",
  //         () => {
  //           this.#spellSelectWindow.setToActiveColor();
  //           this.context.inputUi?.enemySelectWindow.setToActiveColor();
  //           this.scene.requestPopState();
  //         }));
  //       break;

  //     default:
  //       assertNever(nextFlow.kind);
  //   }
  // }

  // キャラクターの行動確定時
  // #onConfirmCommand(command: CommandChoice, rewindMarker: number): void {
  //   // 各種選択ウィンドウのカーソル位置をリセットしておく
  //   this.#resetSelectionWindows();
  //   // このステートの上に乗せられたものは全て解除
  //   this.scene.requestRewindTo(rewindMarker);
  //   // このステート自身を取り除く
  //   this.scene.requestPopState();
  //   // 確定処理
  //   this.#callbacks.onDecide(command);
  // }

  // #resetSelectionWindows(): void {
  //   this.#spellSelectWindow.reset();
  //   this.#enemySelectWindow.reset();
  // }

  #activate(): void {
    this.#spellSelectWindow.visible = true;
    this.#spellSelectWindow.setActive(true);
  }

  #inactivate(): void {
    this.#spellSelectWindow.visible = false;
    this.#spellSelectWindow.setActive(false);
  }
}
