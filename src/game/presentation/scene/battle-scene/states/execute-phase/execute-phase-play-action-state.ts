import { BaseBattleSceneState, TurnResolution } from "../battle-scene-state";
import { BattleSceneContext } from "..";
import { BattleScene } from "../..";
import { AudioPort, BattleMessageWindow, UILayoutCoordinator, SeId } from "../../../../";
import { assertNever, toZenkaku } from "@shared";
import { AtomicEffect } from "@game/application";
import { ActorId } from "@game/domain";

// 味方のダメージ時にウィンドウが揺れている時間(ms)
const ALLY_SHAKE_BY_DAMAGE_DURATION_MS = 500;
// 敵がダメージ時に点滅している時間(ms)
const ENEMY_BLINK_BY_DAMAGE_DURATION_MS = 500;

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
      this.scene,
      context.ui.audio,
      {
        clear: () => this.context.executeUi?.messageWindow.clearText(),
        print: (text: string) => this.context.executeUi?.messageWindow.addText(text),
        shake: () => this.context.executeUi?.coordinator.shake(this.context.executeUi.messageWindow),
        playSe: (id: SeId): void => this.context.ui.audio.play(id),
        resolveName: (actorId: ActorId): string => this.scene.getActorDisplayNameById(actorId),
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
  processed: boolean; // TODO: console.log じゃなくなったら削除
}

type EffectDeps = {
  clear: () => void,
  print: (text: string) => void,
  shake: () => void,
  playSe: (id: SeId) => void,
  resolveName: (actorId: ActorId) => string,
};

class EffectRunner {
  #scene: BattleScene;
  #deps: EffectDeps;
  #isRunning: boolean;
  #queue: Task[] = [];

  constructor(effects: ReadonlyArray<AtomicEffect>, scene: BattleScene, audioPort: AudioPort, messageDeps: EffectDeps) {
    this.#queue = effects.map(e => ({ effect: e, remainingMs: durationOf(e), processed: false}));
    this.#scene = scene;
    this.#isRunning = 0 < this.#queue.length;
    this.#deps = messageDeps;
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
    if (task.processed) return;
    task.processed = true;
    const effect = task.effect;

    switch (effect.kind) {
      case "ClearMessage":
        if (__DEV__) console.log("メッセージウィンドウ消去");
        this.#deps.clear();
        break;

      case "AttackStarted":
        if (__DEV__) console.log(`🗡️ ${this.#deps.resolveName(effect.actorId)}の こうげき！`);
        this.#deps.print(`${this.#deps.resolveName(effect.actorId)}の　こうげき！`);
        break;

      case "PlaySe":
        if (__DEV__) console.log(`🎧 SE再生: ${effect.seId}`);
        this.#deps.playSe(effect.seId);
        break;

      case "EnemyDamageBlink":
        if (__DEV__) console.log(`💥 敵点滅: actor=${effect.actorId}`);
        this.#scene.getEnemyViewByActorId(effect.actorId).blinkByDamage(ENEMY_BLINK_BY_DAMAGE_DURATION_MS);
        break;

      case "ShowEnemyDamageText":
        if (__DEV__) console.log(`📝 ${this.#deps.resolveName(effect.actorId)}に ${toZenkaku(effect.amount)}の ダメージ！！`);
        this.#deps.print(`${this.#deps.resolveName(effect.actorId)}に　${toZenkaku(effect.amount)}の　ダメージ！！`);
        break;

      case "PlayerDamageShake":
        if (__DEV__) console.log(`😵 味方ダメージで画面揺れ: actor=${effect.actorId}`);
        this.#deps.shake();
        break;

      case "ShowPlayerDamageText":
        if (__DEV__) console.log(`📝 ${this.#deps.resolveName(effect.actorId)}は ${toZenkaku(effect.amount)}の ダメージをうけた！`);
        this.#deps.print(`${this.#deps.resolveName(effect.actorId)}は　${toZenkaku(effect.amount)}の　ダメージをうけた！`);
        break;

      default:
        assertNever(effect);
    }
  }
}

function durationOf(effect: Readonly<AtomicEffect>): number {
  switch (effect.kind) {
    case "ClearMessage": return 0;
    case "AttackStarted": return 420;
    case "PlaySe": return 0;
    case "ShowPlayerDamageText": return 0;
    case "PlayerDamageShake": return ALLY_SHAKE_BY_DAMAGE_DURATION_MS;
    case "ShowEnemyDamageText": return 0;
    case "EnemyDamageBlink": return ENEMY_BLINK_BY_DAMAGE_DURATION_MS;
    default: assertNever(effect);
  }
}
