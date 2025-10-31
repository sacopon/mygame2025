import { extensions, ExtensionType } from "pixi.js";
import { RuntimeContext, WebAudioAdapter } from "..";
import { setFirstTouchCallback } from "@core";

function registerWebAudioLoader(loaderFunc: (url: string) => Promise<AudioBuffer>): void {
  extensions.add({
    name: "web-audio-loader",
    extension: ExtensionType.LoadParser,
    test: (url: string, options: { format?: string }) => {
      const audioExtensions = ["mp3", "ogg", "wav"];
      const ext = options.format ?? (url.split("?")[0].split(".").pop() ?? "").toLowerCase();
      return audioExtensions.includes(ext);
    },
    load: loaderFunc,
    unload: async (_buffer: AudioBuffer) => { /* 特になし */ },
  });
}

export function setupAudio(rc: RuntimeContext): void {
  // オーディオ周り(Pixi Loader への登録も含む)
  rc.audio = new WebAudioAdapter();
  registerWebAudioLoader((url: string) => rc.audio!.load(url));

  // 初回タッチ時に WebAudio を初期化するコールバックを登録
  setFirstTouchCallback(() => { rc.audio.unlock(); });
}
