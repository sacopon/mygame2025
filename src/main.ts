import "@/index.css";
import { Application, Assets, Container, Graphics, Sprite } from "pixi.js";
import { PAD_BIT, InputState } from "@/shared";
import { disableBrowserGestures, registerPwaServiceWorker } from "@/core/browser";
import { bindKeyboard } from "@/app/input";
import { relayoutViewport, relayoutViewportBare } from "@/app/features/ui/layout";
import { isUIMode, UIMODE, type UIMode } from "@/app/features/ui/mode";
import { SkinResolver } from "@/app/features/ui/skin";
import { VirtualPadUI } from "@/app/features/ui/virtual-pad";
import { createResizeHandler, onResize } from "@/app/services/resize";
import { AppContext } from "@/app/config";
import { GameScreen, GameScreenSpec, VIRTUAL_SCREEN_CHANGE } from "@/app/services/screen";

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

export function buildAppContext(parent: Container): AppContext {
  // コンテナ作成
  const root = new Container();
  parent.addChild(root);

  // 背景
  const background = Sprite.from("screen_bg.png");
  background.anchor.set(0.5);
  root.addChild(background);

  // バーチャルパッドUIとゲーム画面の共通の親
  const deviceLayer = new Container();
  root.addChild(deviceLayer);

  // 仮想のゲーム機本体(仮想ゲーム画面の背面に置かれる画像)用のレイヤー
  const frameLayer = new Container();
  // ゲーム画面レイヤー
  const gameLayer = new Container();
  // 仮想のゲーム機UI(仮想ゲーム画面の前面に置かれる画像)用のレイヤー
  const overlayLayer = new Container();

  deviceLayer.addChild(frameLayer);   // 本体
  deviceLayer.addChild(gameLayer);    // 画面
  deviceLayer.addChild(overlayLayer); // ボタン

  // 何も入れないうちはイベントを拾わないようにしておく
  frameLayer.eventMode   = "none";
  overlayLayer.eventMode = "none";

  return { root, background, deviceLayer, frameLayer, gameLayer, overlayLayer };
}

(async () => {
  // abort 時に終了処理を実行するためのインスタンス
  const ac = new AbortController();
  const opts = { signal: ac.signal } as AddEventListenerOptions;

  // PWA の ServiceWorker を設定
  registerPwaServiceWorker(makePath("sw.js"));

  // 入力モード(URLから取得する/実行中に切り替え可能にする)
  const modeQuery = new URLSearchParams(location.search).get("mode");
  let mode: UIMode = isUIMode(modeQuery) ? modeQuery : UIMODE.PAD;

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
  const context = buildAppContext(app.stage);

  let padUI: VirtualPadUI | null = null;

  if (mode === UIMODE.PAD) {
    padUI = VirtualPadUI.attach(context, skins.current, inputState);
  }

  // // 初回の画面更新
  // onResize(app, context, gameScreenSpec, skins, window.innerWidth, window.innerHeight, true, mode);

  // 初期レイアウト
  if (mode === UIMODE.PAD) {
    relayoutViewport(app, context, gameScreenSpec, skins.current, window.innerWidth, window.innerHeight);
  }
  else {
    relayoutViewportBare(app, context, gameScreenSpec, window.innerWidth, window.innerHeight, true);
  }

  // ゲーム画面内のサンプル描画
  drawGameSample(context.gameLayer, gameScreenSpec.current.width, gameScreenSpec.current.height);

  // キーボード入力イベント
  const unbindKeyboard = bindKeyboard(window, inputState);

  // 画面再構築が必要なイベントを登録
  // 回転・アドレスバー変動・PWA復帰など広めにカバー
  const handleResize = createResizeHandler(app, context, gameScreenSpec, skins, () => ({ mode, padUI }));
  window.addEventListener("resize", handleResize, opts);
  window.visualViewport?.addEventListener("resize", handleResize, opts);
  window.addEventListener("orientationchange", handleResize, opts);
  window.addEventListener("pageshow", handleResize, opts);

  const toggleMode = () => {
    if (mode === UIMODE.PAD) {
      padUI?.detach();
      mode = UIMODE.BARE;
    }
    else {
      if (!padUI) {
        padUI = VirtualPadUI.attach(context, skins.current, inputState);
      } else {
        padUI.reattach();
      }

      mode = UIMODE.PAD;
    }

    onResize(app, context, gameScreenSpec, skins, window.innerWidth, window.innerHeight, { mode, forceApplySkin: true, padUI });
  };

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
    if (padUI) {
      padUI.updateButtonImages();
    }

    if ((inputState.composed() & ~inputState.previousComposed()) & (1 << PAD_BIT.BUTTON3)) {
      toggleMode();
    }

    inputState.next();
  };
  app.ticker.add(tick);

  // 初回再描画
  onResize(app, context, gameScreenSpec, skins, window.innerWidth, window.innerHeight, { mode, forceApplySkin: true, padUI });

  // abort 時の終了処理
  ac.signal.addEventListener("abort", () => {
    app.ticker.remove(tick);
    unbindKeyboard();
  });

  // 終了時に abort を呼び出す設定
  window.addEventListener("unload", () => ac.abort(), { once: true });
})();
