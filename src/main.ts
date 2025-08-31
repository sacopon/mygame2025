import { Application, Assets, Container, Graphics, Sprite } from "pixi.js";
import "@/index.css";
import { Skin, skins } from "@/skin";
import { disableBrowserGestures, registerPwaServiceWorker } from "@/core/browser/browser-utils";
import { GAME_SCREEN } from "@/app/constants";
import { UiContext } from "@/app/types";
import { InputState } from "@/app/input/input-state";
import { bindKeyboard } from "@/app/input/bind-keyboard";
import { buildUiContext } from "@/app/ui/virtualpad";
import { relayoutViewport, updateButtonImages } from "@/app/ui/layout";
import { SkinResolver } from "@/app/skin/resolver";
import { applySkin } from "@/app/ui/applySkin";
import { SkinRegistry } from "./app/skin/registry";

/**
 * リソース読み込み用URLを作成する
 */
const makePath = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/**
 * ゲーム仮画面の描画
 *
 * @param gameScreenContainer ゲーム画面用コンテナ 
 */
function drawGameSample(gameScreenContainer: Container) {
  // 赤い四角
  const g1 = new Graphics();
  g1.rect(0, 0, GAME_SCREEN.WIDTH, GAME_SCREEN.HEIGHT);
  g1.fill({ color: 0xff0000, alpha: 1 });
  gameScreenContainer.addChild(g1);
  // 青い四角
  const g2 = new Graphics();
  g2.rect(0, 0, 16, 16);
  g2.fill({ color: 0x0000ff, alpha: 1 });
  gameScreenContainer.addChild(g2);

  const smile = Sprite.from("smile.png");
  smile.texture.source.scaleMode = "nearest";
  smile.anchor.set(0.5);
  smile.position.set(GAME_SCREEN.WIDTH / 2, GAME_SCREEN.HEIGHT / 2);
  gameScreenContainer.addChild(smile);
}

function loadAssetsAsync() {
  return Assets.load([
    // 全体背景
    { alias: "screen_bg.png", src: makePath("textures/screen_bg.png") },
    // バーチャルパッドUI
    makePath("textures/virtualui.json"),
    // ゲーム本編系画像(SAMPLE)
    { alias: "smile.png", src: makePath("textures/smile.png") },
  ]);
}

(async () => {
  // PWA の ServiceWorker を設定
  registerPwaServiceWorker(makePath("sw.js"));

  const app = new Application();
  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1099bb,
    roundPixels: true,  // 描画座標に小数値が渡された場合に整数値に丸める
  });
  document.body.appendChild(app.canvas);

  // ブラウザデフォルトのジェスチャ操作を禁止
  disableBrowserGestures(app.canvas);

  // 画像読み込み
  await loadAssetsAsync();

  // 画面上のUI要素の構築
  const inputState = new InputState();
  const context = buildUiContext(app.stage, SkinRegistry.portrait, inputState);
  const skins = new SkinResolver();

  // 初回の画面更新
  const w = window.innerWidth;
  const h = window.innerHeight;
  skins.update(w, h);
  const firstSkin = skins.current;
  applySkin(context, firstSkin);

  // ゲーム画面内のサンプル描画
  drawGameSample(context.gameLayer);
  relayoutViewport(app, context, firstSkin, w, h);

  // キーボード入力イベント
  const unbindKeyboard = bindKeyboard(window, inputState);

  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const changed = skins.update(w, h);

    if (changed) {
      applySkin(context, skins.current);
    }

    relayoutViewport(app, context, skins.current, w, h);
  };

  // 画面再構築が必要なイベントを登録
  // 回転・アドレスバー変動・PWA復帰など広めにカバー
  window.addEventListener("resize", onResize);
  window.visualViewport?.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  window.addEventListener("pageshow", onResize);

  // 終了時の解除
  window.addEventListener("unload", unbindKeyboard);

  // 毎フレーム呼ばれる処理を追加
  app.ticker.add((/*deltaTime*/) => updateButtonImages(skins.current, inputState, context.dpad, context.buttons));
})();
