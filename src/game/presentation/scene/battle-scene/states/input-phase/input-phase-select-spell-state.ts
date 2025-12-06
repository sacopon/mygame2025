import { BaseBattleSceneState, BattleSceneContext } from "../../states/battle-scene-state";
import { AllyActor, Spell } from "@game/domain";
import { BattleCommand, BattleScene, CommandChoice, InputPhaseCallbacks, InputPhaseSelectTargetAllyState, InputPhaseSelectTargetEnemyState } from "../..";
import { GameButton, SpellDetailWindow, SpellSelectWindow } from "../../../..";

/**
 * バトルシーン状態: 呪文選択
 */
export class InputPhaseSelectSpellState extends BaseBattleSceneState {
  #callbacks: InputPhaseCallbacks;
  #actor: AllyActor;
  // 呪文選択ウィンドウ
  #spellSelectWindow: SpellSelectWindow | null = null;
  // 呪文説明/消費MPウィンドウ
  #spellDetailWindow: SpellDetailWindow | null = null;
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

    const actorState = this.context.domainState.getAllyActorState(this.#actor.actorId);

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

    // 呪文説明/消費MPウィンドウ生成
    this.#spellDetailWindow = this.scene.spawn(new SpellDetailWindow(context.ui));
    this.#spellDetailWindow.setContent(this.#spellSelectWindow.getCurrent(), actorState.currentMp);
    context.inputUi?.coordinator.placeSpellDetailWindow(this.#spellDetailWindow);

    // 呪文選択ウィンドウを最前面に移動する
    context.inputUi?.coordinator.bringToFrontSpellSelectWindow(this.#spellSelectWindow);
    // 呪文詳細ウィンドウを最前面に移動する
    context.inputUi?.coordinator.bringToFrontSpellDetailWindow(this.#spellDetailWindow);
  }

  override onLeave(_context: BattleSceneContext): void {
    this.#locked = false;

    if (this.#spellSelectWindow) {
      this.context.inputUi?.coordinator.placeSpellSelectWindow(null);
      this.scene.despawn(this.#spellSelectWindow);
      this.#spellSelectWindow = null;
    }

    if (this.#spellDetailWindow) {
      this.context.inputUi?.coordinator.placeSpellDetailWindow(null);
      this.scene.despawn(this.#spellDetailWindow);
      this.#spellDetailWindow = null;
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
    if (this.#locked || !this.#spellSelectWindow || !this.#spellDetailWindow) {
      return;
    }

    const inp = this.context.ui.input;
    const detailWindow = this.#spellDetailWindow;
    const ok = inp.pressed(GameButton.A);
    const cancel = inp.pressed(GameButton.B);
    const up = inp.pressed(GameButton.Up);
    const down = inp.pressed(GameButton.Down);
    const left = inp.pressed(GameButton.Left);
    const right = inp.pressed(GameButton.Right);
    const changeDetailWindow = (spell: Spell) => {
      const state = this.context.domainState.getAllyActorState(this.#actor.actorId);
      detailWindow.setContent(spell, state.currentMp);
    };

    // 決定
    if (ok) {
      this.#locked = true;
      this.context.ui.audio.playSe("cursor");
      this.#handleSpellSelected(this.#spellSelectWindow.getCurrent());
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
      changeDetailWindow(this.#spellSelectWindow.getCurrent());
    }
    else if (down) {
      this.#spellSelectWindow.moveVertical(1);
      changeDetailWindow(this.#spellSelectWindow.getCurrent());
    }
    else if (left) {
      this.#spellSelectWindow.moveHorizontal(-1);
      changeDetailWindow(this.#spellSelectWindow.getCurrent());
    }
    else if (right) {
      this.#spellSelectWindow.moveHorizontal(1);
      changeDetailWindow(this.#spellSelectWindow.getCurrent());
    }
  }

  #handleSpellSelected(spell: Spell): void {
    if (spell.target.scope === "all") {
      if (spell.target.side === "us") {
        // 味方全体
        const choice: Extract<CommandChoice, { command: typeof BattleCommand.Spell }> = {
          actorId: this.#actor.actorId,
          command: BattleCommand.Spell,
          spellId: spell.spellId,
          target: {
            kind: "allyAll",
          },
        };

        // 妥当性チェック(選択できない相手を選んでいないか)
        if (!this.#callbacks.canDecide(choice)) {
          // もし何かしらメッセージを表示するならメッセージ表示のステートを push する
        }

        // 確定処理
        this.#commitCommandChoice(choice);
        return;
      }
      else {
        // 敵全体
        const choice: Extract<CommandChoice, { command: typeof BattleCommand.Spell }> = {
          actorId: this.#actor.actorId,
          command: BattleCommand.Spell,
          spellId: spell.spellId,
          target: {
            kind: "enemyAll",
          },
        };

        // 妥当性チェック(選択できない相手を選んでいないか)
        if (!this.#callbacks.canDecide(choice)) {
          // もし何かしらメッセージを表示するならメッセージ表示のステートを push する
        }

        // 確定処理
        this.#commitCommandChoice(choice);
        return;
      }
    }
    else if ((spell.target.scope === "single" || spell.target.scope === "group") && spell.target.side === "them") {
      // 下に隠れている敵選択ウィンドウを最前面に移動
      this.context.inputUi?.coordinator.bringToFrontEnemySelectWindow(this.context.inputUi.enemySelectWindow);
      // TODO: 呪文詳細ウィンドウを非表示にする

      // 敵側のの単体 or グループが対象の場合、敵選択ウィンドウへ
      this.scene.requestPushState(new InputPhaseSelectTargetEnemyState(
        this.scene,
        this.context.inputUi!.enemySelectWindow,
        {
          // 敵選択決定時
          onTargetSelected: targetGroupId => {
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
            this.#commitCommandChoice(choice);
          },
          // 敵選択キャンセル時
          onCancel: () => {
            // 敵選択をキャンセルしたら呪文選択に戻る
            this.#locked = false;
            // 敵選択ウィンドウが最前面に来ているので、自身を再度最前面に
            this.context.inputUi?.coordinator.bringToFrontSpellSelectWindow(this.#spellSelectWindow);
            this.context.inputUi?.coordinator.bringToFrontSpellDetailWindow(this.#spellDetailWindow);
          }
        }));

      return;
    }
    else if (spell.target.scope === "single" && spell.target.side === "us") {
      // 味方単体
      this.scene.requestPushState(new InputPhaseSelectTargetAllyState(
        this.scene,
        {
          // キャラクター選択決定時
          onTargetSelected: allyActorId => {
            const choice: Extract<CommandChoice, { command: typeof BattleCommand.Spell }> = {
              actorId: this.#actor.actorId,
              command: BattleCommand.Spell,
              spellId: spell.spellId,
              target: {
                kind: "ally",
                actorId: allyActorId,
              },
            };

            // 妥当性チェック(選択できない相手を選んでいないか)
            if (!this.#callbacks.canDecide(choice)) {
              // もし何かしらメッセージを表示するならメッセージ表示のステートを push する
            }

            // 確定処理
            this.#commitCommandChoice(choice);
          },
          // 敵選択キャンセル時
          onCancel: () => {
            // 敵選択をキャンセルしたら呪文選択に戻る
            this.#locked = false;
          }
        }));

      return;
    }

    // その他の組み合わせはエラー扱い
    throw new Error(`Unsupported spell target scope: spell=${spell.spellId}, scope=${spell.target.scope}, side=${spell.target.side}`);
  }

  #commitCommandChoice(choice: CommandChoice): void {
    // 呪文選択ウィンドウのカーソル位置リセット
    this.#spellSelectWindow?.reset();
    // 上に積まれているステートを全削除
    this.scene.requestRewindTo(this.#rewindMarker);
    // このステート自身を取り除く
    this.scene.requestPopState();
    // 最終確定時コールバックの呼び出し
    this.#callbacks.onDecide(choice);
  }

  #activate(): void {
    this.#spellSelectWindow?.setActive(true);
  }

  #inactivate(): void {
    this.#spellSelectWindow?.setActive(false);
  }
}
