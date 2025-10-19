import { BaseBattleSceneState, TurnResolution } from "../battle-scene-state";
import { BattleSceneContext } from "..";
import { BattleScene } from "../..";
import { AtomicEffect } from "@game/application";
import { assertNever } from "@shared/utils";

/**
 * バトルシーン状態: 演出実行
 * AtomicEffect ごとに演出を実行しつつ、ViewState へ状態の反映を行なっていく
 */
export class ExecutePhasePlayActionState extends BaseBattleSceneState {
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
    this.#effectRunner = new EffectRunner(context.turnResolution.atomicEffects);
  }

  override update(deltaMs: number) {
    this.#effectRunner.update(deltaMs);

    if (!this.#effectRunner.isRunning) {
      this.scene.returnToInputPhaseForNextTurn();
      return;
    }
  }

  override onLeave() {
    // 次のターンに備えてクリアする
    this.context.commandChoices = [];
    this.context.turnPlan = undefined;
    this.context.turnResolution = undefined;
  }

  get turnResolution(): TurnResolution {
    return this.context.turnResolution!;
  }
}

type Task = {
  effect: AtomicEffect;
  remainingMs: number;
  printed: boolean; // TODO: console.log じゃなくなったら削除
}

class EffectRunner {
  #isRunning: boolean;
  #queue: Task[] = [];

  constructor(effects: ReadonlyArray<AtomicEffect>) {
    this.#queue = effects.map(e => ({ effect: e, remainingMs: durationOf(e), printed: false}));
    this.#isRunning = 0 < this.#queue.length;
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
      case "AttackStarted":
        // TODO: actorId => Actor.name に変換する
        if (__DEV__) console.log(`🗡️ ${effect.actorId}の　こうげき！`);
        break;

      case "PlaySe":
        if (__DEV__) console.log(`🎧 SE再生: ${effect.seId}`);
        break;

      case "EnemyDamageBlink":
        if (__DEV__) console.log(`💥 敵点滅: actor=${effect.actorId}`);
        break;

      case "ShowEnemyDamageText":
        // TODO: actorId => Actor.name に変換する
        if (__DEV__) console.log(`📝 ${effect.actorId}に　${effect.amount}の　ダメージ！！`);
        break;

      case "PlayerDamageShake":
        if (__DEV__) console.log(`😵 味方ダメージで画面揺れ: actor=${effect.actorId}`);
        break;

      case "ShowPlayerDamageText":
        // TODO: actorId => Actor.name に変換する
        if (__DEV__) console.log(`📝 ${effect.actorId}は　${effect.amount}の　ダメージをうけた！`);
        break;

      default:
        assertNever(effect);
    }
  }
}

function durationOf(effect: Readonly<AtomicEffect>): number {
  switch (effect.kind) {
    case "AttackStarted": return 0;
    case "PlaySe": return 0;
    case "ShowPlayerDamageText": return 0;
    case "PlayerDamageShake": return 0;
    case "ShowEnemyDamageText": return 0;
    case "EnemyDamageBlink": return 0;
    default: assertNever(effect);
  }
}
