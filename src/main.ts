import "./index.css";
import { Application, Assets, BitmapFont, Container, extensions, ExtensionType, Graphics, Sprite, Spritesheet, Ticker } from "pixi.js";
import { PAD_BIT, InputState } from "@shared";

import {
  disableBrowserGestures,
  makePath,
  registerPwaServiceWorker,
  setFirstTouchCallback
} from "@core";

import {
  AppContext,
  bindKeyboard,
  createResizeHandler,
  GameScreenSpec,
  InputPortAdapter,
  isUIMode,
  onResize,
  PixiRenderAdapter,
  relayoutViewport,
  relayoutViewportBare,
  ScreenPortAdapter,
  SkinResolver,
  UIMode,
  UIMODE,
  ViewportMetrics,
  VirtualPadUI,
  WebAudioAdapter,
  XorShiftRandomAdapter
} from "@app";

import { GameRoot } from "@game";

function loadInitialAssetsAsync(webAudioAdapter: WebAudioAdapter) {
  const resources = [
    // 全体背景
    { alias: "screen_bg.png", src: makePath("textures/screen_bg.png") },
    // バーチャルパッドUI
    { alias: "virtualui.json", src: makePath("textures/virtualui.json") },
    // ゲーム本編系画像(SAMPLE)
    { alias: "game.json", src: makePath("textures/game.json") },
  ];

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
  ];

  const nearestSpriteSheets = new Set([
    "game.json",
  ]);

  const nearestBitmapFonts = new Set([
  ]);

  const promises = Assets
    .load([...resources, ...bgmResources, ...seResources])
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
    .then(() => document.fonts.load("20px \"BestTen\""))
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

function createDebugSoundOnOffButton(parent: Container, callback: () => boolean) {
  const buttonContainer = new Container();
  parent.addChild(buttonContainer);
  const button = new Graphics();
  const buttonSize = 48;
  button.pivot.set(buttonSize / 2, buttonSize / 2);
  button.rect(0, 0, buttonSize, buttonSize);
  button.fill({ color: 0x666666 });
  button.interactive = true;
  button.on("pointerdown", () => {
    button.scale.set(1.2);
  });
  // button.on("pointermove", () => {
  //   button.scale.set(1.0);
  // });
  button.on("pointerup", () => {
    const muted = callback();
    if (muted) { button.clear().rect(0, 0, buttonSize, buttonSize).fill({ color: 0x666666 }); }
    else { button.clear().rect(0, 0, buttonSize, buttonSize).fill({ color: 0x00FF00 }); }

    button.scale.set(1.0);
  });
  buttonContainer.addChild(button);
  const longSide = 64;
  const shortSide = 32;
  buttonContainer.position.set(
    window.innerWidth < window.innerHeight ? shortSide : longSide,
    window.innerWidth < window.innerHeight ? longSide : shortSide);
}

function buildAppContext(parent: Container, debugCallback: () => boolean): AppContext {
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

  // ゲーム画面外のUI 用
  const appUiLayer = new Container();
  root.addChild(appUiLayer);
  // 暫定的デバッグミュートボタン配置
  createDebugSoundOnOffButton(appUiLayer, debugCallback);

  // 仮想のゲーム機本体(仮想ゲーム画面の背面に置かれる画像)用のレイヤー
  const frameLayer = new Container();
  // ゲーム画面レイヤー
  const gameLayer = new Container();

  // ゲーム画面内の描画がはみ出さないようにマスク
  const gameLayerMask = new Graphics();
  gameLayerMask.eventMode = "none";
  gameLayer.addChild(gameLayerMask);  // マスクの座標系をマスクをかけるレイヤーの座標系にするため gameLayer の子にする
  gameLayer.mask = gameLayerMask;

  // ゲーム画面の中身用コンテナ(ゲーム画面コンテナを全削除した際にマスクまで削除してしまわないように分ける)
  const gameContentLayer = new Container();
  gameContentLayer.sortableChildren = true;
  gameLayer.addChild(gameContentLayer);

  // 仮想のゲーム機UI(仮想ゲーム画面の前面に置かれる画像)用のレイヤー
  const overlayLayer = new Container();

  deviceLayer.addChild(frameLayer);   // 本体
  deviceLayer.addChild(gameLayer);    // 画面
  deviceLayer.addChild(overlayLayer); // ボタン

  // 何も入れないうちはイベントを拾わないようにしておく
  frameLayer.eventMode = "none";
  overlayLayer.eventMode = "none";

  const viewportMetrics = new ViewportMetrics();

  return {
    root,
    background,
    deviceLayer,
    frameLayer,
    gameLayer,
    gameContentLayer,
    gameLayerMask,
    overlayLayer,
    viewportMetrics,
  };
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

  // サウンドポートの作成と pixi のローダーへの登録
  const audioPort = new WebAudioAdapter();
  registerWebAudioLoader((url: string) => audioPort.load(url));

  // アセットの読み込み
  await loadInitialAssetsAsync(audioPort);

  // 画面上のUI要素の構築
  const gameScreenSpec = new GameScreenSpec();
  const inputState = new InputState();
  const skins = new SkinResolver(window.innerWidth < window.innerHeight ? "portrait" : "landscape");
  const context = buildAppContext(app.stage,
    () => {
      // Mute/Mute 解除はすぐに反映されないので直前の状態から結果を送る
      audioPort.setMuted(!audioPort.isMuted);
      return audioPort.isMuted;
    });

  // ポート・ゲーム側システムの作成
  const renderPort = new PixiRenderAdapter(context.gameLayer);
  const screenPort = new ScreenPortAdapter(gameScreenSpec);
  const inputPort = new InputPortAdapter(inputState);
  const randomPort = XorShiftRandomAdapter.create();  // TODO: セーブデータがある場合はシードを指定する
  // 初回タッチ時にサウンドのサスペンドを解除する設定(ブラウザの場合、タッチイベント契機でないとこの操作ができない)
  setFirstTouchCallback(() => { audioPort.unlock(); });
  const gameRoot = new GameRoot({ render: renderPort, screen: screenPort, input: inputPort, audio: audioPort, random: randomPort });

  let padUI: VirtualPadUI | null = null;

  if (mode === UIMODE.PAD) {
    padUI = VirtualPadUI.attach(context, skins.current, inputState);
  }

  // 初期レイアウト
  if (mode === UIMODE.PAD) {
    relayoutViewport(app, context, gameScreenSpec, skins.current, window.innerWidth, window.innerHeight);
  }
  else {
    relayoutViewportBare(app, context, gameScreenSpec, window.innerWidth, window.innerHeight);
  }

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

  // // 仮想解像度が変わったら「再構築」（シーン作り直し/タイル再ロード等）
  // gameScreenSpec.addEventListener(VIRTUAL_SCREEN_CHANGE, (_ev: Event) => {
  // }, { signal: ac.signal });

  // // 毎回のリサイズでは「投影/カメラだけ更新」
  // context.viewportMetrics.addEventListener(VIEWPORT_METRICS_CHANGED, _ev => {
  // }, { signal: ac.signal });

  // 毎フレーム呼ばれる処理を追加
  const tick = (ticker: Ticker) => {
    if (padUI) {
      padUI.updateButtonImages();
    }

    if ((inputState.composed() & ~inputState.previousComposed()) & (1 << PAD_BIT.BUTTON3)) {
      toggleMode();
    }

    // ゲーム側の更新処理
    gameRoot.update(ticker.deltaMS);

    // キー入力を次のフレームに備える
    inputState.next();
  };
  app.ticker.add(tick);

  // 初回再描画
  onResize(app, context, gameScreenSpec, skins, window.innerWidth, window.innerHeight, { mode, forceApplySkin: true, padUI });

  // abort 時の終了処理
  ac.signal.addEventListener("abort", () => {
    app.ticker.remove(tick);

    gameRoot.dispose();
    unbindKeyboard();
  });

  // 終了時に abort を呼び出す設定
  window.addEventListener("pagehide", () => ac.abort(), { once: true });
})();
