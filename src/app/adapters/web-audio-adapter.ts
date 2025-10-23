import { AudioPort } from "../../game/presentation/ports/audio-port";

const isiOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);

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
  #analyser: AnalyserNode | null = null;
  #analyserBuf: Uint8Array<ArrayBuffer> | null = null;

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

    this.#bgmBuffers = new Map<string, AudioBuffer>();
    this.#seBuffers = new Map<string, AudioBuffer>();
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

  playSe(id: string): void {
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

  playBgm(id: string): void {
    if (id === this.#currentBgmId && this.#currentBgmSource) return;
    const buffer = this.#bgmBuffers.get(id);
    if (!buffer) return;

    // ★ AudioContext がまだ “running” になってなければ必ず pending
    if (this.#context.state !== "running" || !this.#resumed) {
console.log("BGMはpendingされました");
      this.#pendingBgmId = id;
      return;
    }

    // ここまで来たら即再生（startWhenReady を使わない）
    this.#playBgmNow(id);
  }

  resumeIfSuspended() {
    if (this.#resumed) { return; }
    // ユーザー操作中でなければ呼ばない（警告回避）
    // https://developer.mozilla.org/docs/Web/API/Navigator/userActivation
    const ua = navigator.userActivation;
    console.log(ua);
    if (ua && !ua.isActive) return;

    const state = this.#context.state;
    if (state !== "suspended") {
      this.#resumed = (state === "running");
      if (this.#resumed && this.#pendingBgmId) {
        this.playBgm(this.#pendingBgmId);
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
          this.playBgm(this.#pendingBgmId);
          this.#pendingBgmId = null;
        }
      }
    };
    this.#context.addEventListener("statechange", onState, { once: true });
  }

  // 追加: ユーザージェスチャ内で呼ぶ専用
  async unlock(): Promise<void> {
    const empty = this.#context.createBufferSource();
    empty.start();
    empty.stop();
    this.#context.resume();

    await this.#waitAudibleOnBgmPath(300);

    if (this.#pendingBgmId) {
      this.#playBgmNow(this.#pendingBgmId!);
    }
  }


  // unlock 内で使う：BGM経路を起こして可聴サンプル流通をRAFで検知
  async #waitAudibleOnBgmPath(maxMs = 300): Promise<boolean> {
    // Analyser を用意（1回だけ作る）
    if (!this.#analyser) {
      this.#analyser = this.#context.createAnalyser();
      this.#analyser.fftSize = 512; // 小さめでOK
      this.#bgmGain.connect(this.#analyser);
      this.#analyserBuf = new Uint8Array(this.#analyser.frequencyBinCount);
    }

    // 微音オシレータで BGM 経路を“プライム”
    const osc = this.#context.createOscillator();
    const g = this.#context.createGain();
    g.gain.value = 0.001;          // ほぼ無音（0 はダメ）
    osc.connect(g).connect(this.#bgmGain);
    const t0 = this.#context.currentTime + 0.01;   // iOS 安定化のため少し先
    osc.start(t0);
    osc.stop(t0 + 0.05);           // 50ms だけ

    // RAF で 〜maxMs 監視
    const started = performance.now();
    return await new Promise<boolean>(resolve => {
      const tick = () => {
        // ノイズとして発生しないようにゲインの接続先を切る(メソッドの先頭だと効かないのでここで毎回行う)
        try { this.#bgmGain.disconnect(this.#context.destination); } catch {}

        // 周波数ドメインでも時間ドメインでもOK。ここは簡単に波形の「非フラット」を見る
        this.#analyser!.getByteTimeDomainData!(this.#analyserBuf!);
        // 中央 128 からの偏差がしきい値越えのサンプル数を数える
        let count = 0;
        for (let i = 0; i < this.#analyserBuf!.length; i++) {
          if (Math.abs(this.#analyserBuf![i] - 128) > 2) count++; // しきい値は小さめで
        }
        if (count > 5) {
          // 何サンプルか動いていればOKとみなす
          this.#bgmGain.connect(this.#context.destination, 0, 0);
          resolve(true);
          return;
        }

        if (performance.now() - started > maxMs) {
          this.#bgmGain.connect(this.#context.destination, 0, 0);
          resolve(false);
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  // 内部: 即座に BGM を鳴らす（startWhenReady を通らない）
  #playBgmNow(id: string, startAt?: number): void {
console.log("#playBgmNow");
    const buffer = this.#bgmBuffers.get(id);
    if (!buffer) {
console.log("#buffer is null");
      return;
    }

    try { this.#currentBgmSource?.stop(); } catch(e) { console.log(e); }
    this.#currentBgmSource = null;

    const src = this.#context.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(this.#bgmGain);
    try { src.start(startAt ?? this.#context.currentTime); } catch(e) { console.log(e); }
    this.#currentBgmSource = src;
    this.#currentBgmId = id;
console.log("#playBgmNow end");
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
        this.#context.resume()
          .then(() => {
            // startFn();

            // // ここで pending BGM も同じタップ内に開始
            // if (this.#pendingBgmId) {
            //   this.#playBgmNow(this.#pendingBgmId, this.#context.currentTime + 0.01);
            //   this.#pendingBgmId = null;
            // }
          })
          .catch(() => {});
      } catch {}

      return true;
    }

    // ユーザー操作外での再生命令は無視する（警告も出ない）
    return false;
  }
}
