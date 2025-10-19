import { BaseBattleSceneState, TurnResolution } from "../battle-scene-state";
import { BattleSceneContext } from "..";
import { BattleScene } from "../..";
import { AtomicEffect } from "@game/application";
import { assertNever } from "@shared/utils";
import { BattleMessageWindow, UILayoutCoordinator } from "@game/presentation/game-object";
import { ActorId } from "@game/domain";

/**
 * バトルシーン状態: 演出実行
 * AtomicEffect ごとに演出を実行しつつ、ViewState へ状態の反映を行なっていく
 */
export class ExecutePhasePlayActionState extends BaseBattleSceneState {
  #messageWindow!: BattleMessageWindow;
  #effectRunner!: EffectRunner;

  constructor(scene: BattleScene) {
    super(scene);
  }

  override onEnter(context: BattleSceneContext) {
    super.onEnter(context);

    if (!context.turnResolution) {
      throw new Error("onEnter: BattleSceneContext.turnResolution is null");
    }

    if (__DEV__) console.log(context.turnResolution);

    const { ui } = this.context;
    const { width, height } = ui.screen.getGameSize();

    // メッセージランナー作成
    this.#effectRunner = new EffectRunner(
      context.turnResolution.atomicEffects,
      (actorId: ActorId): string => this.scene.getActorDisplayNameById(actorId),
      {
        clear: () => this.context.executeUi?.messageWindow.clearText(),
        print: (text: string) => this.context.executeUi?.messageWindow.addText(text),
      });

    // メッセージウィンドウを作成
    const messageWindow = this.scene.spawn(new BattleMessageWindow(this.context.ui));
    // レイアウトコーディネイター
    const coordinator = this.scene.spawn(new UILayoutCoordinator(ui, width, height, { messageWindow }));

    this.context.executeUi = {
      coordinator,
      messageWindow,
    };
  }

  override update(deltaMs: number) {
    this.#effectRunner.update(deltaMs);

    if (!this.#effectRunner.isRunning) {
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
    this.context.executeUi = undefined;
  }
}

type Task = {
  effect: AtomicEffect;
  remainingMs: number;
  printed: boolean; // TODO: console.log じゃなくなったら削除
}

type MessageDeps = {
  clear: () => void,
  print: (text: string) => void,
};

class EffectRunner {
  #resolveName: (actorId: ActorId) => string;
  #message: MessageDeps;
  #isRunning: boolean;
  #queue: Task[] = [];

  constructor(effects: ReadonlyArray<AtomicEffect>, resolveName: (actorId: ActorId) => string, messageDeps: MessageDeps) {
    this.#queue = effects.map(e => ({ effect: e, remainingMs: durationOf(e), printed: false}));
    this.#isRunning = 0 < this.#queue.length;
    this.#resolveName = resolveName;
    this.#message = messageDeps;
  }

  update(deltaMs: number): void {
    if (!this.isRunning) { return; }
    const top = this.#queue[0];
    if (!top) { this.#isRunning = false; return; }

    this.processTask(top);
    top.remainingMs -= deltaMs;

    if (top.remainingMs <= 0) {
      this.#queue.shift();

      if (this.#queue.length === 0) {
        this.#isRunning = false;
      }
    }
  }

  get isRunning(): boolean {
    return this.#isRunning;
  }

  /**
  * AtomicEffect を順次処理していく（今はログ出力のみ）
  */
  processTask(task: Task): void {
    if (task.printed) return;
    task.printed = true;
    const effect = task.effect;

    switch (effect.kind) {
      case "ClearMessage":
        if (__DEV__) console.log("メッセージウィンドウ消去");
        this.#message.clear();
        break;

      case "AttackStarted":
        if (__DEV__) console.log(`🗡️ ${this.#resolveName(effect.actorId)}の　こうげき！`);
        this.#message.print(`${this.#resolveName(effect.actorId)}の　こうげき！`);
        break;

      case "PlaySe":
        if (__DEV__) console.log(`🎧 SE再生: ${effect.seId}`);
        break;

      case "EnemyDamageBlink":
        if (__DEV__) console.log(`💥 敵点滅: actor=${effect.actorId}`);
        break;

      case "ShowEnemyDamageText":
        if (__DEV__) console.log(`📝 ${this.#resolveName(effect.actorId)}に　${effect.amount}の　ダメージ！！`);
        this.#message.print(`${this.#resolveName(effect.actorId)}に　${effect.amount}の　ダメージ！！`);
        break;

      case "PlayerDamageShake":
        if (__DEV__) console.log(`😵 味方ダメージで画面揺れ: actor=${effect.actorId}`);
        break;

      case "ShowPlayerDamageText":
        if (__DEV__) console.log(`📝 ${this.#resolveName(effect.actorId)}は　${effect.amount}の　ダメージをうけた！`);
        this.#message.print(`${this.#resolveName(effect.actorId)}は　${effect.amount}の　ダメージをうけた！`);
        break;

      default:
        assertNever(effect);
    }
  }
}

function durationOf(effect: Readonly<AtomicEffect>): number {
  switch (effect.kind) {
    case "ClearMessage": return 0;
    case "AttackStarted": return 50;
    case "PlaySe": return 0;
    case "ShowPlayerDamageText": return 50;
    case "PlayerDamageShake": return 0;
    case "ShowEnemyDamageText": return 50;
    case "EnemyDamageBlink": return 0;
    default: assertNever(effect);
  }
}
