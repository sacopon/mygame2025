import { BaseBattleSceneState } from "../battle-scene-state";
import { BattleScene, BattleSceneContext } from "../..";
import { AllySelectWindow, GameButton } from "../../../..";
import { ActorId } from "@game/domain";

export type AllySelectEvents = {
  onTargetSelected: (targetAllyActorId: ActorId) => void;
  onCancel: () => void;
}

/**
 * バトルシーン状態: 対象(味方)選択
 */
export class InputPhaseSelectTargetAllyState extends BaseBattleSceneState {
  #allySelectWindow: AllySelectWindow | null = null;
  #callbacks: AllySelectEvents;

  constructor(scene: BattleScene, callbacks: AllySelectEvents) {
    super(scene);
    this.#callbacks = callbacks;
  }

  override onEnter(context: BattleSceneContext) {
    super.onEnter(context);

    // 味方キャラクター選択ウィンドウ生成
    const allies = context.domainState.getAliveAllyActorStates();
    this.#allySelectWindow = this.scene.spawn(
      new AllySelectWindow(
        context.ui,
        // TODO: ↓ as AllyId 消せないのか？
        allies.map(ally => ({ actorId: ally.actorId, name: context.domain.allyRepository.findAlly(ally.originId).name }))));
    context.inputUi?.coordinator.placeAllySelectWindow(this.#allySelectWindow);
    context.inputUi?.coordinator.bringToFrontAllySelectWindow(this.#allySelectWindow);
    this.#allySelectWindow.setActive(true);
  }

  override onLeave(_context: BattleSceneContext): void {
    if (!this.#allySelectWindow) { return; }

    this.scene.despawn(this.#allySelectWindow);
    this.#allySelectWindow = null;
  }

  override onSuspend(): void {
    this.#inactivate();
  }

  override onResume(): void {
    this.#activate();
  }

  override update(_deltaTime: number): void {
    if (!this.#allySelectWindow) { return; }

    const inp = this.context.ui.input;
    const cancel = inp.pressed(GameButton.B);
    const ok = inp.pressed(GameButton.A);
    const up = inp.pressed(GameButton.Up);
    const down = inp.pressed(GameButton.Down);

    if (cancel) {
      // キャンセル
      this.#allySelectWindow.reset();
      // このステート自身を取り除く
      this.scene.requestPopState();
      // キャンセル処理
      this.#callbacks.onCancel();
    }
    else if (ok) {
      // 決定
      this.context.ui.audio.playSe("cursor");

      const target = this.#allySelectWindow.getCurrent();
      this.#callbacks.onTargetSelected(target.actorId);
    }
    else if (up) {
      // カーソル上移動
      this.#allySelectWindow.selectPrev();
    }
    else if (down) {
      // カーソル下移動
      this.#allySelectWindow.selectNext();
    }
  }

  #activate(): void {
    if (!this.#allySelectWindow) { return; }
    this.#allySelectWindow.setActive(true);
  }

  #inactivate(): void {
    if (!this.#allySelectWindow) { return; }
    this.#allySelectWindow.setActive(false);
  }
}
