import { makePath } from "@core";
import { WebAudioAdapter } from "../..";
import { Assets, BitmapFont, Spritesheet } from "pixi.js";

export async function loadInitialSoundAssetsAsync(webAudioAdapter: WebAudioAdapter): Promise<void> {
  // BGM
  const bgmResources = [
    { alias: "battle", src: makePath("sounds/bgm/battle.mp3") },
  ];

  // SE
  const seResources = [
    { alias: "cursor", src: makePath("sounds/se/cursor.mp3") },
    { alias: "cancel", src: makePath("sounds/se/cancel.mp3") },
    { alias: "player_attack", src: makePath("sounds/se/player_attack.mp3") },
    { alias: "enemy_attack", src: makePath("sounds/se/enemy_attack.mp3") },
    { alias: "player_damage", src: makePath("sounds/se/player_damage.mp3") },
    { alias: "enemy_damage", src: makePath("sounds/se/enemy_damage.mp3") },
    { alias: "miss", src: makePath("sounds/se/miss.mp3") },
  ];

  const promises = Assets
    .load([...bgmResources, ...seResources])
    .then(() => {
      // サウンドの登録
      for (const { alias } of bgmResources) {
        const buffer = Assets.get<AudioBuffer>(alias);

        if (buffer) {
          webAudioAdapter.registerBgmBuffer(alias, buffer);
        }
      }

      for (const { alias } of seResources) {
        const buffer = Assets.get<AudioBuffer>(alias);

        if (buffer) {
          webAudioAdapter.registerSeBuffer(alias, buffer);
        }
      }
    });

  return promises;
}

export async function loadInitialImageAssetsAsync(): Promise<void> {
  const resources = [
    // 全体背景
    { alias: "screen_bg.png", src: makePath("textures/screen_bg.png") },
    // バーチャルパッドUI
    { alias: "virtualui.json", src: makePath("textures/virtualui.json") },
    // ゲーム本編系画像(SAMPLE)
    { alias: "game.json", src: makePath("textures/game.json") },
  ];

  const nearestSpriteSheets = new Set([
    "game.json",
  ]);

  const nearestBitmapFonts = new Set([
  ]);

  const promises = Assets
    .load([...resources])
    .then(() => {
      // アセットの種類別に、紐づいているテクスチャのスケールモードを nearest に設定する
      // スプライトシート
      nearestSpriteSheets.forEach(alias => {
        const sheet = Assets.get(alias) as Spritesheet | undefined;

        if (!sheet) {
          return;
        }

        for (const tex of Object.values(sheet.textures)) {
          tex.source.scaleMode = "nearest";
        }
      });

      // ビットマップフォント
      nearestBitmapFonts.forEach(alias => {
        const font = Assets.get<BitmapFont>(alias);

        if (!font) {
          return;
        }

        for (const page of font.pages) {
          page.texture.source.scaleMode = "nearest";
        }
      });
    })
    .then(() => {
      document.fonts.load("20px \"BestTen\"");
    });

  return promises;
}
