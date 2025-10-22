import { BgmId, SeId } from "@game/presentation";
import { AudioPort } from "../../game/presentation/ports/audio-port";

/**
 * WebAudio によるサウンド再生の実装
 */
export class WebAudioAdapter implements AudioPort {
  // WebAudio のコンテキスト
  #context: AudioContext;
  // 初期化済みフラグ
  #resumed: boolean;
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
    this.#resumed = false;
    this.#currentBgmSource = null;
    this.#currentBgmId = null;
    this.#pendingBgmId = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    this.#context = new Ctor();

    this.#bgmGain = this.#context.createGain();
    this.#bgmGain.gain.value = 0.15;  // TODO: 音でかいのでとりあえず 0.15 で・・・(SEより小さめ)
    this.#bgmGain.connect(this.#context.destination);

    this.#seGain = this.#context.createGain();
    this.#seGain.gain.value = 0.25;  // TODO: 音でかいのでとりあえず 0.25 で・・・
    this.#seGain.connect(this.#context.destination);

    this.#bgmBuffers = new Map<BgmId, AudioBuffer>();
    this.#seBuffers = new Map<SeId, AudioBuffer>();
  }

  async load(url: string): Promise<AudioBuffer> {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    return await this.#context.decodeAudioData(arr);
  }

  registerSeBuffer(seId: string, buffer: AudioBuffer): void {
    this.#seBuffers.set(seId, buffer);
  }

  registerBgmBuffer(bgmId: string, buffer: AudioBuffer): void {
    this.#bgmBuffers.set(bgmId, buffer);
  }

  playSe(id: SeId): void {
    const buffer = this.#seBuffers.get(id);

    if (!buffer) {
      return;
    }

    this.#startWhenReady(() => {
      const source = this.#context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.#seGain);
      try { source.start(this.#context.currentTime); } catch {}
    });
  }

  playBgm(id: BgmId): void {
    if (id === this.#currentBgmId && this.#currentBgmSource) {
      return;
    }

    const buffer = this.#bgmBuffers.get(id);

    if (!buffer) {
      return;
    }

    const executed = this.#startWhenReady(() => {
      // 既存のBGMを止める
      try { this.#currentBgmSource?.stop(); } catch {}
      this.#currentBgmSource = null;

      const source = this.#context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(this.#bgmGain);
      try { source.start(this.#context.currentTime); } catch {}
      this.#currentBgmSource = source;
      this.#currentBgmId = id;
    });

    // 再生できなかったらペンディングに積む
    if (!executed) {
      this.#pendingBgmId = id;
    }
  }

  resumeIfSuspended() {
    if (this.#resumed) { return; }
    // ユーザー操作中でなければ呼ばない（警告回避）
    // https://developer.mozilla.org/docs/Web/API/Navigator/userActivation
    const ua = navigator.userActivation;
    if (ua && !ua.isActive) return;

    const state = this.#context.state;
    if (state !== "suspended") {
      this.#resumed = (state === "running");
      if (this.#resumed && this.#pendingBgmId) {
        this.playBgm(this.#pendingBgmId as BgmId);
        this.#pendingBgmId = null;
      }

      return;
    }

    try { this.#context.resume(); } catch {}

    const onState = () => {
      if ((this.#context.state === "running")) {
        this.#resumed = true;
        this.#context.removeEventListener("statechange", onState);

        if (this.#pendingBgmId) {
          this.playBgm(this.#pendingBgmId as BgmId);
          this.#pendingBgmId = null;
        }
      }
    };
    this.#context.addEventListener("statechange", onState, { once: true });
  }

  dispose(): void {
    try { this.#currentBgmSource?.stop(); } catch {}
    this.#currentBgmId = this.#pendingBgmId = this.#currentBgmSource = null;

    this.#bgmBuffers.clear();
    this.#seBuffers.clear();
    try { this.#bgmGain.disconnect(); } catch {}
    try { this.#seGain.disconnect(); } catch {}
    try { this.#context.close(); } catch {}
  }

  // 再生開始時にまだタッチジェスチャによる解除が行われていなかった場合に対応するためのヘルパー
  // 再生されなかった(startFn がコールバックされなかった)場合は false
  #startWhenReady(startFn: () => void): boolean {
    if ((this.#context.state as string) === "running") {
      startFn();
      return true;
    }

    const ua = navigator.userActivation;
    const isActive = ua?.isActive ?? true;  // userActivation が取れない環境ではOKとみなす=Safari対策

    if (isActive) {
      // 同一タップ内：先に resume を確実に完了させ、その後 start
      try {
        void this.#context.resume().then(() => startFn()).catch(() => {});
      } catch {}

      return true;
    }

    // ユーザー操作外での再生命令は無視する（警告も出ない）
    return false;
  }
}
