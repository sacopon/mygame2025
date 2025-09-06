import "@/index.css";
import { Application, Assets, Container, Graphics, Sprite } from "pixi.js";
import { GameScreen, GameScreenSpec, SkinResolver, VIRTUAL_SCREEN_CHANGE } from "@/app";
import { PAD_BIT, InputState } from "@/shared";
import { disableBrowserGestures, registerPwaServiceWorker } from "@/core/browser";
import { bindKeyboard } from "@/app/input";
import { buildUiContext, type UIMode, updateButtonImages } from "@/app/ui";
import { createResizeHandler, onResize } from "@/app/resize";

/**
 * リソース読み込み用URLを作成する
 */
const makePath = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/**
 * ゲーム仮画面の描画
 *
 * @param gameScreenContainer ゲーム画面用コンテナ 
 */
function drawGameSample(gameScreenContainer: Container, w: number, h: number) {
  gameScreenContainer.removeChildren();

  // 赤い四角
  const g1 = new Graphics();
  g1.rect(0, 0, w, h);
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
  smile.position.set(w / 2, h / 2);
  gameScreenContainer.addChild(smile);
}

function loadInitialAssetsAsync() {
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
  // abort 時に終了処理を実行するためのインスタンス
  const ac = new AbortController();
  const opts = { signal: ac.signal } as AddEventListenerOptions;

  // PWA の ServiceWorker を設定
  registerPwaServiceWorker(makePath("sw.js"));

  // 入力モード(URLから取得する/実行中に切り替え可能にする)
  let mode: UIMode = "pad";

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
  await loadInitialAssetsAsync();

  // 画面上のUI要素の構築
  const gameScreenSpec = new GameScreenSpec();
  const inputState = new InputState();
  const skins = new SkinResolver(window.innerWidth < window.innerHeight ? "portrait" : "landscape");
  const context = buildUiContext(app.stage, skins.current, inputState);

  // @ts-expect-error TS2367: mode は実行時に切り替わる想定
  if (mode === "bare") {
    context.uiLayer.visible = false;
    context.uiLayer.eventMode = "none";
  }

  // 初回の画面更新
  onResize(app, context, gameScreenSpec, skins, window.innerWidth, window.innerHeight, true, mode);

  // ゲーム画面内のサンプル描画
  drawGameSample(context.gameLayer, gameScreenSpec.current.width, gameScreenSpec.current.height);

  // キーボード入力イベント
  const unbindKeyboard = bindKeyboard(window, inputState);

  // 画面再構築が必要なイベントを登録
  // 回転・アドレスバー変動・PWA復帰など広めにカバー
  const handleResize = createResizeHandler(app, context, gameScreenSpec, skins, () => mode);
  window.addEventListener("resize", handleResize, opts);
  window.visualViewport?.addEventListener("resize", handleResize, opts);
  window.addEventListener("orientationchange", handleResize, opts);
  window.addEventListener("pageshow", handleResize, opts);

  // 仮想解像度が変わったら「再構築」（シーン作り直し/タイル再ロード等）
  gameScreenSpec.addEventListener(VIRTUAL_SCREEN_CHANGE, (ev: Event) => {
    const { detail } = ev as CustomEvent<GameScreen>;
    drawGameSample(context.gameLayer, detail.width, detail.height);
  }, { signal: ac.signal });

  // // 毎回のリサイズでは「投影/カメラだけ更新」
  // gameScreenSpec.addEventListener(VIEWPORT_METRICS, (e: any) => {
  //   const { screen, scale, mode } = e.detail;
  //   game.updateProjection(screen.x, screen.y, screen.w, screen.h, scale, mode);
  // }, { signal: ac.signal });

  // 毎フレーム呼ばれる処理を追加
  const tick = (/*deltaTime*/) => {
    if (mode === "pad") {
      updateButtonImages(skins.current, inputState, context.dpad, context.buttons);
    }

    if ((inputState.composed() & ~inputState.previousComposed()) & (1 << PAD_BIT.BUTTON3)) {
      // （任意）ランタイムで切替したい場合
      mode = mode === "pad" ? "bare" : "pad";
      const show = mode === "pad";
      context.uiLayer.visible = show;
      context.uiLayer.eventMode = show ? "static" : "none";
      onResize(app, context, gameScreenSpec, skins, innerWidth, innerHeight, true, mode);
    }

    inputState.next();
  };
  app.ticker.add(tick);

  // abort 時の終了処理
  ac.signal.addEventListener("abort", () => {
    app.ticker.remove(tick);
    unbindKeyboard();
  });

  // 終了時に abort を呼び出す設定
  window.addEventListener("unload", () => ac.abort(), { once: true });
})();
