import { SeId } from "@game/presentation";
import { AudioPort } from "../../game/presentation/ports/audio-port";

/**
 * WebAudio によるサウンド再生の実装
 */
export class WebAudioAdapter implements AudioPort {
  #context: AudioContext;
  #resumed: boolean = false;
  #gain: GainNode;
  #buffers: Map<string, AudioBuffer>;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    this.#context = new Ctor();
    this.#gain = this.#context.createGain();
    this.#gain.gain.value = 0.25;  // TODO: 音でかいのでとりあえず 0.25 で・・・
    this.#gain.connect(this.#context.destination);

    this.#buffers = new Map<SeId, AudioBuffer>();
  }

  async load(url: string): Promise<AudioBuffer> {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    return await this.#context.decodeAudioData(arr);
  }

  registerBuffer(seId: string, buffer: AudioBuffer): void {
    this.#buffers.set(seId, buffer);
  }

  play(id: SeId): void {
    const buffer = this.#buffers.get(id);

    if (!buffer) {
      return;
    }

    this.#runOrQueue(() => {
      const source = this.#context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.#gain);
      try { source.start(); } catch {}
    });
  }

  #runOrQueue(startFn: () => void): void {
    if ((this.#context.state as string) === "running") {
      startFn();
      return;
    }

    const ua = navigator.userActivation;
    const isActive = ua?.isActive ?? true;  // userActivation が取れない環境ではOKとみなす=Safari対策

    if (isActive) {
      // 同一タップ内：先に resume を確実に完了させ、その後 start
      try {
        void this.#context.resume().then(() => startFn()).catch(() => {});
      } catch {}
    } else {
      // ★ユーザー操作外での再生命令は無視する（警告も出ない）
      // console.log("[Audio] Ignored SE play because userActivation is not active.");
    }
  }

  resumeIfSuspended() {
    if (this.#resumed) { return; }
    // ★ ユーザー操作中でなければ呼ばない（警告回避）
    //   https://developer.mozilla.org/docs/Web/API/Navigator/userActivation
    const ua = navigator.userActivation;
    if (ua && !ua.isActive) return;

    if (this.#context.state === "suspended") {
      try { this.#context.resume(); } catch {}
    }

    const onState = () => {
      if ((this.#context.state as string === "running")) {
        this.#resumed = true;
        this.#context.removeEventListener("statechange", onState);
      }
    };
    this.#context.addEventListener("statechange", onState, { once: true });
  }

  dispose(): void {
    this.#buffers.clear();
    try { this.#gain.disconnect(); } catch {}
    try { this.#context.close(); } catch {}
  }
}
