import { SeId } from "..";
import { assertNever, toZenkaku } from "@shared";
import { PresentationEffect } from "@game/application";
import { ActorId, BattleDomainState, SpellId } from "@game/domain";

// 味方のダメージ時にウィンドウが揺れている時間(ms)
const ALLY_SHAKE_BY_DAMAGE_DURATION_MS = 650;
// 敵がダメージ時に点滅している時間(ms)
const ENEMY_BLINK_BY_DAMAGE_DURATION_MS = 550;
// ミス！表示の時間(ms)
const MISS_TEXT_DURATION_MS = 50;
// 回復した表示の時間(ms)
const HEAL_TEXT_DURATIN_MS = 550;
// 後続のダメージなし表示の時間(ms)
const NO_DAMAGE_TEXT_DURATION_MS = 500;
// クリティカル(会心/痛恨)表示の時間(ms)
const CRITICAL_TEXT_DURATION_MS = 400;

/**
 * ランナー側で使用する依存部分
 */
type EffectDeps = {
  applyState: (state: Readonly<BattleDomainState>) => void,
  clear: () => void,
  print: (text: string) => void,
  removeLast: () => void,
  removeExceptFirst: () => void,
  bilkEnemyByDamage: (id: ActorId, durationMs: number) => void,
  hideEnemyByDefeat: (id: ActorId) => void,
  shake: () => void,
  playSe: (id: SeId) => void,
  resolveName: (actorId: ActorId) => string,
  resolveSpell: (spellId: SpellId) => string,
};

/**
 * 効果ごとの演出時間を取得する
 */
function durationOf(effect: Readonly<PresentationEffect>): number {
  switch (effect.kind) {
    case "ApplyState": return 0;
    case "ClearMessageWindowText": return 50; // 同じメッセージが連続する場合に消えている状態が少しだけ見えるように
    case "ClearLastText": return 50;
    case "ClearMessageWindowExceptFirst": return 100;
    case "ShowAttackStartedText": return 420;
    case "ShowCastSpellText": return 500;
    case "PlaySe": return 0;
    case "ShowPlayerDamageText": return 0;
    case "PlayerDamageShake": return ALLY_SHAKE_BY_DAMAGE_DURATION_MS;
    case "ShowEnemyDamageText": return 0;
    case "EnemyDamageBlink": return ENEMY_BLINK_BY_DAMAGE_DURATION_MS;
    case "ShowHealText": return HEAL_TEXT_DURATIN_MS;
    case "ShowMissText": return MISS_TEXT_DURATION_MS;
    case "ShowNoDamageText": return NO_DAMAGE_TEXT_DURATION_MS;
    case "ShowPlayerCriticalText": return CRITICAL_TEXT_DURATION_MS;
    case "ShowEnemyCriticalText": return CRITICAL_TEXT_DURATION_MS;
    case "EnemyHideByDefeat": return 0;
    case "ShowSelfDefenceText": return 630; // ダメージ分が続かない分、攻撃メッセージより1.5倍ほど長めに
    case "ShowDeadText": return 630; // ダメージ分が続かない分、攻撃メッセージより1.5倍ほど長めに
    case "ShowDefeatText": return 630; // ダメージ分が続かない分、攻撃メッセージより1.5倍ほど長めに
    default: assertNever(effect);
  }
}

type Task = {
  index: number;
  effect: PresentationEffect;
  remainingMs: number;
  processed: boolean;
}

/**
 * 演出をひとつずつ実行するランナー
 */
export class PresentationEffectRunner {
  #deps: EffectDeps;
  #isRunning: boolean;
  #queue: Task[] = [];

  constructor(effects: ReadonlyArray<PresentationEffect>, messageDeps: EffectDeps) {
    this.#queue = effects.map((e, index) => ({ index, effect: e, remainingMs: durationOf(e), processed: false }));
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
      case "ApplyState":
        if (__DEV__) { console.log(task.index); effect.state.debugDump(); }
        this.#deps.applyState(effect.state);
        break;

      case "ClearMessageWindowText":
        // if (__DEV__) console.log("メッセージウィンドウ消去");
        this.#deps.clear();
        break;

      case "ClearLastText":
        // if (__DEV__) console.log("最後の1行を消去(次のメッセージが上書き表示");
        // TODO: 最終行の場合のみ消去 or 強制的に末尾消去の判定
        this.#deps.removeLast();
        break;

      case "ClearMessageWindowExceptFirst":
        // if (__DEV__) console.log("最後の1行を消去(次のメッセージが上書き表示");
        this.#deps.removeExceptFirst();
        break;

      case "ShowAttackStartedText":
        // if (__DEV__) console.log(`🗡️ ${this.#deps.resolveName(effect.actorId)}の こうげき！`);
        this.#deps.print(`${this.#deps.resolveName(effect.actorId)}の　こうげき！`);
        break;

      case "PlaySe":
        // if (__DEV__) console.log(`🎧 SE再生: ${effect.seId}`);
        this.#deps.playSe(effect.seId);
        break;

      case "EnemyDamageBlink":
        // if (__DEV__) console.log(`💥 敵点滅: actor=${effect.actorId}`);
        this.#deps.bilkEnemyByDamage(effect.actorId, ENEMY_BLINK_BY_DAMAGE_DURATION_MS);
        break;

      case "EnemyHideByDefeat":
        // if (__DEV__) console.log(`💥 敵消去: actor=${effect.actorId}`);
        this.#deps.hideEnemyByDefeat(effect.actorId);
        break;

      case "ShowEnemyDamageText":
        // if (__DEV__) console.log(`📝 ${this.#deps.resolveName(effect.actorId)}に ${toZenkaku(effect.amount)}の ダメージ！！`);
        this.#deps.print(`${this.#deps.resolveName(effect.actorId)}に　${toZenkaku(effect.amount)}の　ダメージ！！`);
        break;

      case "PlayerDamageShake":
        // if (__DEV__) console.log(`😵 味方ダメージで画面揺れ: actor=${effect.actorId}`);
        this.#deps.shake();
        break;

      case "ShowPlayerDamageText":
        // if (__DEV__) console.log(`📝 ${this.#deps.resolveName(effect.actorId)}は ${toZenkaku(effect.amount)}の ダメージをうけた！`);
        this.#deps.print(`${this.#deps.resolveName(effect.actorId)}は　${toZenkaku(effect.amount)}の　ダメージをうけた！`);
        break;

      case "ShowPlayerCriticalText":
        // if (__DEV__) console.log("📝 会心の　いちげき！");
        this.#deps.print("会心の　いちげき！");
        break;

      case "ShowEnemyCriticalText":
        // if (__DEV__) console.log("📝 痛恨の　いちげき！");
        this.#deps.print("痛恨の　いちげき！");
        break;

      case "ShowMissText":
        // if (__DEV__) console.log("📝 ミス！");
        this.#deps.print("ミス！");
        break;

      case "ShowNoDamageText":
        // if (__DEV__) console.log(`📝 ${this.#deps.resolveName(effect.actorId)}に　ダメージを　与えられない！`);
        this.#deps.print(`${this.#deps.resolveName(effect.actorId)}に　ダメージを　与えられない！`);
        break;

      case "ShowSelfDefenceText":
        // if (__DEV__) console.log(`📝 ${this.#deps.resolveName(effect.actorId)}は みをまもっている。`);
        this.#deps.print(`${this.#deps.resolveName(effect.actorId)}は　みをまもっている。`);
        break;

      case "ShowDeadText":
        // if (__DEV__) console.log(`📝 ${this.#deps.resolveName(effect.actorId)}は しんでしまった！`);
        this.#deps.print(`${this.#deps.resolveName(effect.actorId)}は　しんでしまった！`);
        break;

      case "ShowDefeatText":
        // if (__DEV__) console.log(`📝 ${this.#deps.resolveName(effect.actorId)}を たおした！`);
        this.#deps.print(`${this.#deps.resolveName(effect.actorId)}を　たおした！`);
        break;

      case "ShowCastSpellText":
        // if (__DEV__) console.log(`📝 ${this.#deps.resolveName(effect.actorId)}を となえた！`);
        this.#deps.print(`${this.#deps.resolveName(effect.actorId)}は　${this.#deps.resolveSpell(effect.spellId)}を　となえた！`);
        break;

      case "ShowHealText":
        // if (__DEV__) console.log(`📝 ${this.#deps.resolveName(effect.actorId)}の キズが 回復した！`);
        this.#deps.print(`${this.#deps.resolveName(effect.actorId)}の　キズが　回復した！`);
        break;

      default:
        assertNever(effect);
    }
  }
}
