import { SeId } from "@game/presentation";
import { AudioPort } from "../../game/presentation/ports/audio-port";

/**
 * WebAudio によるサウンド再生の実装
 */
export class WebAudioAdapter implements AudioPort {
  #context: AudioContext;
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

    const source = this.#context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.#gain);
    try { source.start(); } catch {}
  }

  resumeIfSuspended() {
    if (this.#context.state === "suspended") {
      try { this.#context.resume(); } catch {}
    }
  }

  dispose(): void {
    this.#buffers.clear();
    try { this.#gain.disconnect(); } catch {}
    try { this.#context.close(); } catch {}
  }
}
