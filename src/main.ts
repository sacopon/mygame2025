import "./index.css";
import { Application, Assets, Container, Cache, Graphics, Sprite, Spritesheet, Texture } from "pixi.js";

// ゲーム画面の内部サイズ
const GAME_SCREEN_WIDTH = 256;
const GAME_SCREEN_HEIGHT = 224;

let currentSkinIndex = -1;

// 仮想ゲーム機の設定
const skins = [
  // 縦画面用
  {
    // 仮想ゲーム機の大きさ
    body: {
      size: {
        width: 720,
        height: 1280,
      },
      images: ["v_body_lt.png", "v_body_rt.png", "v_body_lb.png", "v_body_rb.png"],
    },
    // 仮想ゲーム画面
    screen: {
      // 大きさ
      size: {
        width: 432,
        height: 378,
      },
      // 位置
      position: {
        x: 152,
        y: 200,
      },
    },
    // キーの定義
    key: {
      // 方向キー
      direction: {
        position: {
          x: 150,
          y: 830,
        },
        image: {
          neutral: "v_dir_neutral.png",
          up: "v_dir_up.png",
          down: "v_dir_down.png",
          left: "v_dir_left.png",
          right: "v_dir_right.png",
        },
      },
      // その他のボタン
      buttons: [
        // ボタン1(Aボタン)
        {
          position: {
            x: 628,
            y: 798,
          },
          image: {
            on: "v_circle_button_on.png",
            off: "v_circle_button_off.png",
          },
        },
        // ボタン2(Bボタン)
        {
          position: {
            x: 518,
            y: 844,
          },
          image: {
            on: "v_circle_button_on.png",
            off: "v_circle_button_off.png",
          },
        },
        // ボタン3(STARTボタン)
        {
          position: {
            x: 378,
            y: 982,
          },
          image: {
            on: "v_rect_button_on.png",
            off: "v_rect_button_off.png",
          },
        },
        // ボタン4(SELECTボタン)
        {
          position: {
            x: 262,
            y: 982,
          },
          image: {
            on: "v_rect_button_on.png",
            off: "v_rect_button_off.png",
          },
        }
      ],
    },
  },
  // 横画面用
  {
    // 仮想ゲーム機の大きさ
    body: {
      size: {
        width: 1280,
        height: 720,
      },
      images: ["h_body_lt.png", "h_body_rt.png", "h_body_lb.png", "h_body_rb.png"],
    },
    // 仮想ゲーム画面
    screen: {
      // 大きさ
      size: {
        width:  410,
        height: 360,
      },
      // 位置
      position: {
        x: 428,
        y:  84,
      },
    },
    // キーの定義
    key: {
      // 方向キー
      direction: {
        position: {
          x: 178,
          y: 256,
        },
        image: {
          neutral: "h_dir_neutral.png",
          up: "h_dir_up.png",
          down: "h_dir_down.png",
          left: "h_dir_left.png",
          right: "h_dir_right.png",
        },
      },
      // その他のボタン
      buttons: [
        // ボタン1(Aボタン)
        {
          position: {
            x: 1120,
            y:  220,
          },
          image: {
            on: "h_circle_button_on.png",
            off: "h_circle_button_off.png",
          },
        },
        // ボタン2(Bボタン)
        {
          position: {
            x: 1046,
            y:  300,
          },
          image: {
            on: "h_circle_button_on.png",
            off: "h_circle_button_off.png",
          },
        },
        // ボタン3(STARTボタン)
        {
          position: {
            x: 1048,
            y:  130,
          },
          image: {
            on: "h_start_button_on.png",
            off: "h_start_button_off.png",
          },
        },
      ],
    },
  }
];

let skin = skins[0];

function buildVirtualConsoleUi(setting: any, bodies: Sprite[], direction: Sprite, buttons: Sprite[]) {
  // ゲーム機本体
  const offset = 0;
  bodies[0].texture = Texture.from(setting.body.images[0]);
  bodies[0].position.set(0, 0 + offset);
  bodies[1].texture = Texture.from(setting.body.images[1]);
  bodies[1].position.set(setting.body.size.width  / 2, 0 + offset);
  bodies[2].texture = Texture.from(setting.body.images[2]);
  bodies[2].position.set(0, setting.body.size.height / 2 + offset);
  bodies[3].texture = Texture.from(setting.body.images[3]);
  bodies[3].position.set(setting.body.size.width  / 2, setting.body.size.height / 2 + offset);

  // 方向キー
  direction.texture = Texture.from(setting.key.direction.image.neutral);
  direction.position.set(
    setting.key.direction.position.x,
    setting.key.direction.position.y);

  // その他ボタン
  buttons.forEach(button => button.visible = false);
  setting.key.buttons.forEach((button: any, i: number) => {
    buttons[i].texture = Texture.from(button.image.off);
    buttons[i].position.set(button.position.x, button.position.y);
    buttons[i].visible = true;
  });
}

function disableBrowserGestures() {
  // 共通禁止（右クリック・長押しメニュー・ダブルタップ等）
  window.addEventListener('contextmenu', e => e.preventDefault()); // 右クリック/長押しメニュー
  window.addEventListener('selectstart', e => e.preventDefault()); // テキスト選択開始
  window.addEventListener('dragstart', e => e.preventDefault());   // 画像ドラッグ

  // ホイール/タッチスクロール・ピンチズーム・ダブルタップズーム抑止
  const opts = { passive: false } as AddEventListenerOptions;
  window.addEventListener('wheel', e => e.preventDefault(), opts);
  window.addEventListener('touchmove', e => e.preventDefault(), opts);
  window.addEventListener('gesturestart', e => e.preventDefault() as any, opts); // iOS Safari 独自
  window.addEventListener('dblclick', e => e.preventDefault(), opts);

  // Android Chrome: バックキー/履歴誤タップ対策
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') e.preventDefault(); // 入力欄が無いのに Backspace で戻るのを防止
  });

  // スワイプバック誤動作軽減（完全には防げません）
  history.pushState(null, '', location.href);

  // このイベントコールバックでゲーム内ポーズを出す等.
  // ブラウザバック自体は戻さずにゲームへフォーカス返す
  window.addEventListener('popstate', () => history.pushState(null, '', location.href));
}

function registerPwaServiceWorker() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL }).catch(console.error);
    });
  }
}

(async () => {
  const app = new Application();

  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1099bb,
    roundPixels: true,
  });

  document.body.appendChild(app.canvas);

  // PWA の ServiceWorker を設定
  registerPwaServiceWorker();

  // ブラウザデフォルトのジェスチャ操作を禁止
  disableBrowserGestures();

  // キャンバスにフォーカスを集める
  app.canvas.setAttribute('tabindex', '0');
  app.canvas.addEventListener('pointerdown', () => app.canvas.focus());
  app.canvas.addEventListener('touchstart', () => app.canvas.focus(), { passive:false });

  // 画像読み込み
  const bg_texture = await Assets.load(`${import.meta.env.BASE_URL}textures/screen_bg.png`);
  await Assets.load(`${import.meta.env.BASE_URL}textures/virtualui.json`);

  // 背景
  const bg_sprite = new Sprite(bg_texture);
  bg_sprite.anchor.set(0.5);
  app.stage.addChild(bg_sprite);

  // コンテナ作成
  const root_container = new Container();
  app.stage.addChild(root_container);

  // UI レイヤー
  const ui_layer = new Container();
  root_container.addChild(ui_layer);

  ui_layer.pivot.set(
    skin.body.size.width  / 2,
    skin.body.size.height / 2);

  // ゲーム機本体(UIレイヤー)
  const body_sprites: Sprite[] = [];
  for (let i = 0; i < 4; ++i) {
    const s = new Sprite();
    s.anchor.set(0);
    ui_layer.addChild(s);
    body_sprites.push(s);
  }

  // 方向キー(UIレイヤー)
  const direction_pad = Sprite.from(skin.key.direction.image.neutral);
  direction_pad.anchor.set(0.5);
  ui_layer.addChild(direction_pad);

  const buttons: Sprite[] = [];

  for (let i = 0; i < 4; ++i) {
    const button = skin.key.buttons[i];
    const sprite = new Sprite();
    sprite.anchor.set(0.5);
    sprite.visible = false;
    ui_layer.addChild(sprite);
    buttons.push(sprite);
  }

  buildVirtualConsoleUi(skin, body_sprites, direction_pad, buttons);

  // ゲーム画面レイヤー
  const game_layer = new Container();
  game_layer.position.set(
    skin.screen.position.x,
    skin.screen.position.y);
  game_layer.pivot.set(0, 0);
  game_layer.scale.set(skin.screen.size.width / GAME_SCREEN_WIDTH);
  ui_layer.addChild(game_layer);

  // ゲーム画面内のサンプル描画
  {
    // 赤い四角
    const g = new Graphics();
    // g.rect(-GAME_SCREEN_WIDTH / 2, -GAME_SCREEN_HEIGHT / 2, GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT);
    g.rect(0, 0, GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT);
    g.fill({ color: 0xff0000, alpha: 1 });
    game_layer.addChild(g);
    // 青い四角
    g.rect(0, 0, 16, 16);
    g.fill({ color: 0x0000ff, alpha: 1 });
    game_layer.addChild(g);
    // // 緑い四角
    // g.rect(GAME_SCREEN_WIDTH / 2 - 8, GAME_SCREEN_HEIGHT / 2 - 8, 16, 16);
    // g.fill({ color: 0x00ff00, alpha: 1 });
    game_layer.addChild(g);

    const smile_tex = await Assets.load(`${import.meta.env.BASE_URL}textures/smile.png`);
    smile_tex.source.scaleMode = "nearest";
    const smile = new Sprite(smile_tex);
    smile.anchor.set(0.5);
    smile.position.set(GAME_SCREEN_WIDTH / 2, GAME_SCREEN_HEIGHT / 2);
    game_layer.addChild(smile);
  }

  function resize() {
    // pixi.js による描画領域を再設定
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    app.renderer.resize(cw, ch);

    const nextSkinIndex = cw < ch ? 0 : 1;

    if (currentSkinIndex != nextSkinIndex) {
      skin = skins[nextSkinIndex];
      currentSkinIndex = nextSkinIndex;

      // 背景を画面中央に
      bg_sprite.position.set(cw / 2, ch / 2);

      // UIレイヤーの pivot を本体画像のサイズに合わせて再設定
      ui_layer.pivot.set(
        skin.body.size.width  / 2,
        skin.body.size.height / 2
      );

      // UI を再配置
      buildVirtualConsoleUi(skin, body_sprites, direction_pad, buttons);

      // game_layer を現在の skin のスクリーン位置・サイズに合わせ直す
      game_layer.position.set(skin.screen.position.x, skin.screen.position.y);
      game_layer.scale.set(skin.screen.size.width / GAME_SCREEN_WIDTH);
    }

    // 全体スケーリングとセンタリング
    const scale = Math.min(
      cw / skin.body.size.width,
      ch / skin.body.size.height);
    root_container.scale.set(scale);
    root_container.position.set((cw / 2) | 0, (ch / 2) | 0);
  }

  // キーボード入力イベント
  window.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") {
      direction_pad.texture = Texture.from(skin.key.direction.image.up);
    } else if (e.key === "ArrowDown") {
      direction_pad.texture = Texture.from(skin.key.direction.image.down);
    } else if (e.key === "ArrowLeft") {
      direction_pad.texture = Texture.from(skin.key.direction.image.left);
    } else if (e.key === "ArrowRight") {
      direction_pad.texture = Texture.from(skin.key.direction.image.right);
    } else if (e.key === "z" || e.key === "Z") {
      const buttonIndex = 0;

      if (buttonIndex < skin.key.buttons.length) {
        buttons[buttonIndex].texture = Texture.from(skin.key.buttons[buttonIndex].image.on);
      }
    } else if (e.key === "x" || e.key === "X") {
      const buttonIndex = 1;

      if (buttonIndex < skin.key.buttons.length) {
        buttons[buttonIndex].texture = Texture.from(skin.key.buttons[buttonIndex].image.on);
      }
    } else if (e.key === "a" || e.key === "A") {
      const buttonIndex = 2;

      if (buttonIndex < skin.key.buttons.length) {
        buttons[buttonIndex].texture = Texture.from(skin.key.buttons[buttonIndex].image.on);
      }
    } else if (e.key === "s" || e.key === "S") {
      const buttonIndex = 3;

      if (buttonIndex < skin.key.buttons.length) {
        buttons[buttonIndex].texture = Texture.from(skin.key.buttons[buttonIndex].image.on);
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    direction_pad.texture = Texture.from(skin.key.direction.image.neutral);

    buttons.forEach((button, i) => {
      if (skin.key.buttons.length <= i) {
        return;
      }

      button.texture = Texture.from(skin.key.buttons[i].image.off);
    });
  });

  window.addEventListener("resize", resize);
  resize();
})();
