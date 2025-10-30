import { BaseBattleSceneState } from "../battle-scene-state";
import { NoticeMessageWindow } from "@game/presentation/game-object/elements/window/notice-message-window";
import { BattleScene, BattleSceneContext } from "../..";
import { GameButton } from "../../../..";

/**
 * バトルシーン状態: メッセージ表示ポップアップ表示中
 */
export class InputPhaseNoticeMessageState extends BaseBattleSceneState {
  #noticeWindow!: NoticeMessageWindow;
  #noticeText: string;
  #onClose: () => void;
  #locked: boolean;

  constructor(scene: BattleScene, text: string, onClose: () => void) {
    super(scene);
    this.#locked = false;
    this.#noticeText = text;
    this.#onClose = onClose;
  }

  override onEnter(context: BattleSceneContext): void {
    super.onEnter(context);

    this.#locked = false;
    this.#noticeWindow = this.scene.spawn(new NoticeMessageWindow(this.context.ui, this.#noticeText));
    const { width, height } = context.ui.screen.getGameSize();
    // TODO: UILayoutCoordinator に持たせて、画面サイズ変化時に再センタリングする
    this.#noticeWindow.setPosition(
      Math.floor((width - this.#noticeWindow.width) / 2),
      Math.floor((height - this.#noticeWindow.height) / 2));
  }

  override onLeave(_context: BattleSceneContext): void {
    this.#locked = false;
    this.scene.despawn(this.#noticeWindow);
  }

  override onSuspend(): void {
    this.#locked = false;
  }

  override onResume(): void {
    this.#locked = false;
  }

  override update(_deltaTime: number): void {
    if (this.#locked) {
      return;
    }

    const inp = this.context.ui.input;
    const ok = inp.pressed(GameButton.A);
    const cancel = inp.pressed(GameButton.B);

    // 決定/キャンセルが押されたら抜ける
    if (ok || cancel) {
      this.#locked = true;
      this.#onClose();
    }
  }
}
