import { BaseBattleSceneState, BattleSceneContext } from "../../states/battle-scene-state";
import { AllyActor, Spell } from "@game/domain";
import { BattleCommand, BattleScene, CommandChoice, InputPhaseCallbacks, InputPhaseSelectTargetEnemyState } from "../..";
import { GameButton, SpellSelectWindow } from "../../../..";

/**
 * バトルシーン状態: 呪文選択
 */
export class InputPhaseSelectSpellState extends BaseBattleSceneState {
  #callbacks: InputPhaseCallbacks;
  #actor: AllyActor;
  // 呪文選択ウィンドウ
  #spellSelectWindow: SpellSelectWindow | null = null;
  // シーンの遷移中など誤操作防止のためのフラグ
  #locked = false;
  // この呪文内容が確定した際にどこまで巻き戻すか(このステートが積まれた時の状態を記録)
  #rewindMarker!: number;

  constructor(
    scene: BattleScene,
    actor: AllyActor,
    callbacks: InputPhaseCallbacks
  ) {
    super(scene);
    this.#actor = actor;
    this.#callbacks = callbacks;
  }

  override onEnter(context: BattleSceneContext): void {
    super.onEnter(context);
    this.#locked = false;
    this.#rewindMarker = this.scene.markState();
    this.#activate();

    // コマンド選択/敵選択ウィンドウを非アクティブにする
    context.inputUi!.commandSelectWindow.setActive(false);
    context.inputUi!.enemySelectWindow.setActive(false, true);  // ウィンドウカラーも非アクティブ色に

    // 呪文選択ウィンドウ生成
    this.#spellSelectWindow = this.scene.spawn(new SpellSelectWindow(
      context.ui,
      this.#actor.name,
      this.#actor.spellIds.map(s => context.domain.spellRepository.findSpell(s))));
    context.inputUi?.coordinator.placeSpellSelectWindow(this.#spellSelectWindow);
    this.#spellSelectWindow.setActive(true);
  }

  override onLeave(_context: BattleSceneContext): void {
    this.#locked = false;

    if (this.#spellSelectWindow) {
      this.context.inputUi?.coordinator.placeSpellSelectWindow(null);
      this.scene.despawn(this.#spellSelectWindow);
      this.#spellSelectWindow = null;
    }

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
    if (this.#locked || !this.#spellSelectWindow) {
      return;
    }

    const inp = this.context.ui.input;
    const ok = inp.pressed(GameButton.A);
    const cancel = inp.pressed(GameButton.B);
    const up = inp.pressed(GameButton.Up);
    const down = inp.pressed(GameButton.Down);
    const left = inp.pressed(GameButton.Left);
    const right = inp.pressed(GameButton.Right);

    // 決定
    if (ok) {
      this.#locked = true;
      this.context.ui.audio.playSe("cursor");
      this.#onSpellDecided(this.#spellSelectWindow.getCurrent());
    }
    // キャンセル
    else if (cancel) {
      console.log("InputPhaseSelectSpellState#update: cancel");
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
      this.#spellSelectWindow.moveVertical(-1);
    }
    else if (down) {
      this.#spellSelectWindow.moveVertical(1);
    }
    else if (left) {
      this.#spellSelectWindow.moveHorizontal(-1);
    }
    else if (right) {
      this.#spellSelectWindow.moveHorizontal(1);
    }
  }

  bringToTop(): void {
    this.#spellSelectWindow?.bringToTop();
  }

  #onSpellDecided(spell: Spell): void {
    if (spell.target.scope === "all") {
      if (spell.target.side === "us") {
        // 味方全体
      }
      else {
        // 敵全体
      }
    }
    else if ((spell.target.scope === "single" || spell.target.scope === "group") && spell.target.side === "them") {
      // 下に隠れている敵選択ウィンドウを最前面に移動
      this.context.inputUi?.enemySelectWindow.bringToTop();

      // 敵側のの単体 or グループが対象の場合、敵選択ウィンドウへ
      this.scene.requestPushState(new InputPhaseSelectTargetEnemyState(
        this.scene,
        this.context.inputUi!.enemySelectWindow,
        {
          // 敵選択決定時
          onConfirm: targetGroupId => {
            const choice: Extract<CommandChoice, { command: typeof BattleCommand.Spell }> = {
              actorId: this.#actor.actorId,
              command: BattleCommand.Spell,
              spellId: spell.spellId,
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
            this.#onConfirmCommand(choice);
          },
          // 敵選択キャンセル時
          onCancel: () => {
            // 敵選択をキャンセルしたら呪文選択に戻る
            this.#locked = false;
            // 敵選択ウィンドウが最前面に来ているので、自身を再度最前面に
            this.bringToTop();
          }
        }));

      return;
    }
    else if (spell.target.scope === "single" && spell.target.side === "us") {
      // 味方単体
    }

    // その他の組み合わせはエラー扱い
    throw new Error(`Unsupported spell target scope: spell=${spell.spellId}, scope=${spell.target.scope}, side=${spell.target.side}`);
  }

  #onConfirmCommand(choice: CommandChoice): void {
    // 呪文選択ウィンドウのカーソル位置リセット
    this.#spellSelectWindow?.reset();
    // 上に積まれているステートを全削除
    this.scene.requestRewindTo(this.#rewindMarker);
    // このステート自身を取り除く
    this.scene.requestPopState();
    // 最終確定時コールバックの呼び出し
    this.#callbacks.onDecide(choice);
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
    this.#spellSelectWindow?.setActive(true);
  }

  #inactivate(): void {
    this.#spellSelectWindow?.setActive(false);
  }
}
