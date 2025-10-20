import { SeId } from "@game/presentation";
import { AudioPort } from "../../game/presentation/ports/audio-port";

/**
 * WebAudio によるサウンド再生の実装
 */
export class WebAudioAdapter implements AudioPort {
  #context: AudioContext;
  #gain: GainNode;
  #buffers: Map<SeId, AudioBuffer>;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    this.#context = new Ctor();
    this.#gain = this.#context.createGain();
    this.#gain.gain.value = 0.25;  // TODO: 音でかいのでとりあえず 0.5 で・・・
    this.#gain.connect(this.#context.destination);

    this.#buffers = new Map<SeId, AudioBuffer>();
  }

  async preloadAsync(source: Record<SeId, string>): Promise<void> {
    await Promise.all(
      (Object.entries(source) as [SeId, string][])
        .map(async ([id, url]) => {
          const res = await fetch(url);
          const arr = await res.arrayBuffer();
          const buff = await this.#context.decodeAudioData(arr);
          this.#buffers.set(id, buff);
        })
    );
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

  async resumeIfSuspendedAsync(): Promise<void> {
    if (this.#context.state === "suspended") {
      await this.#context.resume();
    }
  }

  dispose(): void {
    try { this.#gain.disconnect(); } catch {}
    try { this.#context.close(); } catch {}
  }
}
