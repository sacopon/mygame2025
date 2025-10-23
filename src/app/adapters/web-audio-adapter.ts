import { isSafari, waitByRaf } from "@core";
import { AudioPort } from "../../game/presentation/ports/audio-port";

/**
 * WebAudio によるサウンド再生の実装
 */
export class WebAudioAdapter implements AudioPort {
  // WebAudio のコンテキスト
  #context: AudioContext;
  // 初期化済みフラグ
  #unlocked: boolean;
  // ミュート中フラグ
  #userMuted: boolean;
  // ミュート管理用のボリューム調整弁
  #muteGain: GainNode;
  // BGM 用のボリューム調整弁
  #bgmGain: GainNode;
  // SE 用のボリューム調整弁
  #seGain: GainNode;
  // BGM 名と実体のマップ
  #bgmBuffers: Map<string, AudioBuffer>;
  // SE 名と実体のマップ
  #seBuffers: Map<string, AudioBuffer>;
  // 現在再生中の BGM
  #currentBgmSource: AudioBufferSourceNode | null;
  // 現在再生中の BGM の ID
  #currentBgmId: string | null;
  // ペンディング中の BGM の ID（再生しようとして、まだタッチ操作などが行われていなくてできなかった）
  #pendingBgmId: string | null;

  constructor() {
    this.#unlocked = false;
    this.#currentBgmSource = null;
    this.#currentBgmId = null;
    this.#pendingBgmId = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    this.#context = new Ctor();

    this.#muteGain = this.#context.createGain();
    this.#muteGain.gain.value = 0;
    this.#userMuted = true;

    this.#bgmGain = this.#context.createGain();
    this.#bgmGain.gain.value = 0.15;  // TODO: 音でかいのでとりあえず 0.15 で・・・(SEより小さめ)
    this.#bgmGain.connect(this.#muteGain);

    this.#seGain = this.#context.createGain();
    this.#seGain.gain.value = 0.25;  // TODO: 音でかいのでとりあえず 0.25 で・・・
    this.#seGain.connect(this.#muteGain);

    this.#muteGain.connect(this.#context.destination);
    this.#bgmBuffers = new Map<string, AudioBuffer>();
    this.#seBuffers = new Map<string, AudioBuffer>();
  }

  get isRunning() {
    return this.#context.state === "running" && this.#unlocked;
  }

  async load(url: string): Promise<AudioBuffer> {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    return await this.#context.decodeAudioData(arr);
  }

  /**
   * ユーザージェスチャ時に WebAudio を「解錠」する
   */
  async unlock(): Promise<void> {
    if (this.#unlocked) { return; }
    this.#unlocked = true;

    if (isSafari) {
      const empty = this.#context.createBufferSource();
      empty.start();
      empty.stop();
      this.#context.resume();
    }

    // 300ms ほど待つ
    await waitByRaf(300);

    if (this.#pendingBgmId) {
      this.#playBgm(this.#pendingBgmId!);
    }

    // ミュート状態の反映
    this.#applyMuteNow();
  }

  registerSeBuffer(seId: string, buffer: AudioBuffer): void {
    this.#seBuffers.set(seId, buffer);
  }

  registerBgmBuffer(bgmId: string, buffer: AudioBuffer): void {
    this.#bgmBuffers.set(bgmId, buffer);
  }

  setMuted(muted: boolean): void {
    this.#userMuted = muted;
    this.#applyMuteNow();
  }

  get isMuted(): boolean {
    return this.#userMuted;
  }

  playSe(id: string) {
    if (!this.isRunning) { return; }

    const buffer = this.#seBuffers.get(id);

    if (!buffer) {
      return;
    }

    const source = this.#context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.#seGain);
    try { source.start(this.#context.currentTime); } catch {}
  }

  playBgm(id: string): void {
    if (id === this.#currentBgmId && this.#currentBgmSource) { return; }

    // AudioContext がまだ “running” になってなければ必ず pending
    if (!this.isRunning) {
      // 連打も考慮して常に上書きで処理
      this.#pendingBgmId = id;
      return;
    }

    const buffer = this.#bgmBuffers.get(id);
    if (!buffer) { return; }

    // ここまで来たら再生
    this.#playBgm(id);
  }

  dispose(): void {
    try { this.#currentBgmSource?.stop(); } catch {}
    this.#currentBgmId = this.#pendingBgmId = this.#currentBgmSource = null;

    this.#bgmBuffers.clear();
    this.#seBuffers.clear();
    try { this.#bgmGain.disconnect(); } catch {}
    try { this.#seGain.disconnect(); } catch {}
    try { this.#muteGain.disconnect(); } catch {}
    try { this.#context.close(); } catch {}
  }

  #playBgm(id: string, startAt?: number): void {
    const buffer = this.#bgmBuffers.get(id);
    if (!buffer) { return; }

    try { this.#currentBgmSource?.stop(); } catch(e) { console.log(e); }
    this.#currentBgmSource = null;

    const src = this.#context.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(this.#bgmGain);
    try { src.start(startAt ?? this.#context.currentTime); } catch(e) { console.log(e); }
    this.#currentBgmSource = src;
    this.#currentBgmId = id;
  }

  #applyMuteNow(): void {
    const fromVolume = this.#muteGain.gain.value;
    const toVolume = this.#userMuted ? 0.0 : 1.0;
    const now = this.#context.currentTime;
    this.#muteGain.gain.cancelScheduledValues(now);

    if (this.#context.state === "suspended") {
      // サスペンド中なので即時設定
      this.#muteGain.gain.setValueAtTime(toVolume, now);
    }
    else {
      // ノイズを避けるため 50ms かけてミュート/ミュート解除完了になるように設定
      this.#muteGain.gain.setValueAtTime(fromVolume, now);
      this.#muteGain.gain.linearRampToValueAtTime(toVolume, now + 0.05);
    }
  }
}
