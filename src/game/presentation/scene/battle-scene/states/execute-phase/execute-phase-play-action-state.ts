import { BaseBattleSceneState, TurnResolution } from "../battle-scene-state";
import { BattleScene, BattleSceneContext } from "../..";
import { BattleMessageWindow, UILayoutCoordinator, SeId, PresentationEffectRunner } from "../../../../";
import { ActorId, BattleDomainState } from "@game/domain";
import { StatusWindow } from "@game/presentation/game-object/elements/window/status-window";

/**
 * バトルシーン状態: 演出実行
 * AtomicEffect ごとに演出を実行しつつ、ViewState へ状態の反映を行なっていく
 */
export class ExecutePhasePlayActionState extends BaseBattleSceneState {
  #presentationEffectRunner!: PresentationEffectRunner;

  constructor(scene: BattleScene) {
    super(scene);
  }

  override onEnter(context: BattleSceneContext) {
    super.onEnter(context);

    if (!context.turnResolution) {
      throw new Error("onEnter: BattleSceneContext.turnResolution is null");
    }

    if (__DEV__) console.log(context.turnResolution);

    const resolveName = (actorId: ActorId): string => this.scene.getActorDisplayNameById(actorId);

    // 演出再生のランナー作成
    this.#presentationEffectRunner = new PresentationEffectRunner(
      context.turnResolution.atomicEffects,
      {
        applyState: (state: Readonly<BattleDomainState>) => {
          this.context.domainState = state;
          this.context.executeUi?.statusWindow.updateState(state);
        },
        clear: () => this.context.executeUi?.messageWindow.clearText(),
        print: (text: string) => this.context.executeUi?.messageWindow.addText(text),
        bilkEnemyByDamage: (id: ActorId, durationMs: number) => this.scene.getEnemyViewByActorId(id).blinkByDamage(durationMs),
        shake: () => {
          [
            // ダメージ時に揺れるウィンドウ列挙
            this.context.executeUi?.messageWindow,
            this.context.executeUi?.statusWindow,
          ]
          .filter(w => !!w)
          .forEach(w => this.context.executeUi?.coordinator.shake(w));
        },
        playSe: (id: SeId): void => this.context.ui.audio.playSe(id),
        resolveName,
      });

    // メッセージウィンドウを作成
    const messageWindow = this.scene.spawn(new BattleMessageWindow(this.context.ui));
    // ステータスウィンドウを作成
    const statusWindow = this.scene.spawn(new StatusWindow(this.context.ui, context.domainState, resolveName));
    // レイアウトコーディネイター
    const { width, height } = this.context.ui.screen.getGameSize();
    const coordinator = this.scene.spawn(new UILayoutCoordinator(this.context.ui, width, height, { messageWindow, statusWindow: statusWindow }));

    this.context.executeUi = {
      coordinator,
      messageWindow,
      statusWindow,
    };
  }

  override update(deltaMs: number) {
    this.#presentationEffectRunner.update(deltaMs);

    if (!this.#presentationEffectRunner.isRunning) {
      this.context.domainState = this.context.nextDomainState;
      this.scene.returnToInputPhaseForNextTurn();
      return;
    }
  }

  override onLeave() {
    // UI破棄
    this.#disposeUi();

    // 次のターンに備えてクリアする
    this.context.commandChoices = [];
    this.context.turnPlan = undefined;
    this.context.turnResolution = undefined;
  }

  get turnResolution(): TurnResolution {
    return this.context.turnResolution!;
  }

  /**
   * 入力系UIの後始末
   */
  #disposeUi(): void {
    if (!this.context.executeUi) {
      return;
    }

    this.scene.despawn(this.context.executeUi.coordinator);
    this.scene.despawn(this.context.executeUi.messageWindow);
    this.scene.despawn(this.context.executeUi.statusWindow);
    this.context.executeUi = undefined;
  }
}
