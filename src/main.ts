import "./index.css";
import { Application, Assets, Container, Graphics, SCALE_MODES, Sprite, Spritesheet } from "pixi.js";

// ゲーム画面の内部サイズ
const GAME_SCREEN_WIDTH = 256;
const GAME_SCREEN_HEIGHT = 224;

// 仮想ゲーム機の設定
const virtualConsoleUiSetting = {
  // 仮想ゲーム機の大きさ
  body: {
    size: {
      width: 720,
      height: 1280,
    },
    image: "body.png",
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
      x: 152 -  720 / 2,
      y: 200 - 1280 / 2,
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
        neutral: "dir_neutral.png",
        up: "dir_up.png",
        down: "dir_down.png",
        left: "dir_left.png",
        right: "dir_right.png",
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
          on: "circle_button_on.png",
          off: "circle_button_off.png",
        },
      },
      // ボタン2(Bボタン)
      {
        position: {
          x: 518,
          y: 844,
        },
        image: {
          on: "circle_button_on.png",
          off: "circle_button_off.png",
        },
      },
      // ボタン3(STARTボタン)
      {
        position: {
          x: 378,
          y: 982,
        },
        image: {
          on: "rect_button_on.png",
          off: "rect_button_off.png",
        },
      },
      // ボタン4(SELECTボタン)
      {
        position: {
          x: 262,
          y: 982,
        },
        image: {
          on: "rect_button_on.png",
          off: "rect_button_off.png",
        },
      }
    ],
  },
};

function buildVirtualConsoleUi(setting: any, spriteSheet: Spritesheet, body: Sprite, direction: Sprite, buttons: Sprite[]) {
  // ゲーム機本体
  body.texture = spriteSheet.textures[setting.body.image];
  body.position.set(
    setting.body.size.width  / 2,
    setting.body.size.height / 2);

  // 方向キー
  direction.texture = spriteSheet.textures[setting.key.direction.image.neutral];
  direction.position.set(
    setting.key.direction.position.x,
    setting.key.direction.position.y);

  // その他ボタン
  buttons.forEach((button, i) => {
    button.texture = spriteSheet.textures[setting.key.buttons[i].image.off];
    button.position.set(setting.key.buttons[i].position.x, setting.key.buttons[i].position.y);
  });
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

  // 画像読み込み
  const bg_texture = await Assets.load("/textures/screen_bg.png");
  const vpad_sprite_sheet: Spritesheet = await Assets.load("/textures/virticalui.json");

  // 背景
  const bg_sprite = new Sprite(bg_texture);
  app.stage.addChild(bg_sprite);

  // コンテナ作成
  const root_container = new Container();
  app.stage.addChild(root_container);

  // UI レイヤー
  const ui_layer = new Container();
  root_container.addChild(ui_layer);

  ui_layer.pivot.set(
    virtualConsoleUiSetting.body.size.width  / 2,
    virtualConsoleUiSetting.body.size.height / 2);

  // ゲーム機本体(UIレイヤー)
  const body_sprite = new Sprite(vpad_sprite_sheet.textures[virtualConsoleUiSetting.body.image]);
  body_sprite.anchor.set(0.5);
  ui_layer.addChild(body_sprite);

  // 方向キー(UIレイヤー)
  const direction_pad = new Sprite(vpad_sprite_sheet.textures[virtualConsoleUiSetting.key.direction.image.neutral]);
  direction_pad.anchor.set(0.5);
  ui_layer.addChild(direction_pad);

  const buttons: Sprite[] = [];

  virtualConsoleUiSetting.key.buttons.forEach(button => {
    const sprite = new Sprite(vpad_sprite_sheet.textures[button.image.off]);
    sprite.anchor.set(0.5);
    ui_layer.addChild(sprite);
    buttons.push(sprite);
  });

  buildVirtualConsoleUi(virtualConsoleUiSetting, vpad_sprite_sheet, body_sprite, direction_pad, buttons);

  // ゲーム画面レイヤー
  const game_layer = new Container();
  game_layer.position.set(
    virtualConsoleUiSetting.screen.position.x,
    virtualConsoleUiSetting.screen.position.y);
  game_layer.pivot.set(0, 0);
  game_layer.scale.set(virtualConsoleUiSetting.screen.size.width / GAME_SCREEN_WIDTH);
  root_container.addChild(game_layer);

  console.log(Object.keys(vpad_sprite_sheet.textures));

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

    const smile_tex = await Assets.load("/textures/smile.png");
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

    // スケール計算
    const scale = Math.min(
      cw / virtualConsoleUiSetting.body.size.width,
      ch / virtualConsoleUiSetting.body.size.height);
    root_container.scale.set(scale);

    // UI を再配置
    buildVirtualConsoleUi(virtualConsoleUiSetting, vpad_sprite_sheet, body_sprite, direction_pad, buttons);

    // 描画範囲(ウィンドウ全体)の中央に配置
    root_container.position.set(~~(cw / 2), ~~(ch / 2));
  }

  // キーボード入力イベント
  window.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") {
      direction_pad.texture = vpad_sprite_sheet.textures[virtualConsoleUiSetting.key.direction.image.up];
    } else if (e.key === "ArrowDown") {
      direction_pad.texture = vpad_sprite_sheet.textures[virtualConsoleUiSetting.key.direction.image.down];
    } else if (e.key === "ArrowLeft") {
      direction_pad.texture = vpad_sprite_sheet.textures[virtualConsoleUiSetting.key.direction.image.left];
    } else if (e.key === "ArrowRight") {
      direction_pad.texture = vpad_sprite_sheet.textures[virtualConsoleUiSetting.key.direction.image.right];
    } else if (e.key === "z" || e.key === "Z") {
      buttons[0].texture = vpad_sprite_sheet.textures[virtualConsoleUiSetting.key.buttons[0].image.on];
    } else if (e.key === "x" || e.key === "X") {
      buttons[1].texture = vpad_sprite_sheet.textures[virtualConsoleUiSetting.key.buttons[1].image.on];
    } else if (e.key === "a" || e.key === "A") {
      buttons[2].texture = vpad_sprite_sheet.textures[virtualConsoleUiSetting.key.buttons[2].image.on];
    } else if (e.key === "s" || e.key === "S") {
      buttons[3].texture = vpad_sprite_sheet.textures[virtualConsoleUiSetting.key.buttons[3].image.on];
    }
  });

  window.addEventListener("keyup", (e) => {
    direction_pad.texture = vpad_sprite_sheet.textures[virtualConsoleUiSetting.key.direction.image.neutral];

    buttons.forEach((button, i) => {
      button.texture = vpad_sprite_sheet.textures[virtualConsoleUiSetting.key.buttons[i].image.off];
    });
  });

  window.addEventListener("resize", resize);
  resize();
})();
