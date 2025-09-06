import { type Position, type Size } from "@/shared";

type SkinBody = {
  size: Size;
  images: string[];
}

type SkinScreen = {
  size: Size;
  position: Position;
}

type SkinButtonImage = {
  on: string;
  off: string;
}

type SkinButton = {
  position: Position;
  image: SkinButtonImage;
}

type SkinDpadImage = {
  neutral: string;
  up: string;
  down: string;
  left: string;
  right: string;
}

type SkinDpad = {
  position: Position;
  image: SkinDpadImage;
}

type SkinKey = {
  direction: SkinDpad;
  buttons: SkinButton[];
}

export type Skin = {
  body: SkinBody;
  screen: SkinScreen;
  key: SkinKey;
}

type SkinId = "portrait" | "landscape";

const SkinRegistry: Record<SkinId, Skin> = {
  // 縦画面用
  portrait: {
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
  landscape:
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
        width: 410,
        height: 360,
      },
      // 位置
      position: {
        x: 428,
        y: 84,
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
            y: 220,
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
            y: 300,
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
            y: 130,
          },
          image: {
            on: "h_start_button_on.png",
            off: "h_start_button_off.png",
          },
        },
      ],
    },
  },
};

/** 端末ゆれ対策のヒステリシス。1.05 だと 5% 以上で切替 */
const ORIENT_THRESHOLD = 1.05;

export class SkinResolver {
  #currentId: SkinId;

  public constructor(initial: SkinId = "portrait") {
    this.#currentId = initial;
  }

  public get current(): Skin {
    return SkinRegistry[this.#currentId];
  }

  public get currentId(): SkinId {
    return this.#currentId;
  }

  /**
   * 画面サイズからスキンを判定。境目近辺でのフリップを抑える
   *
   * @param w 画面サイズ幅
   * @param h 画面サイズ高さ
   * @returns 適用すべき SkinId
   */
  public decide(w: number, h: number): SkinId {
    const ratio = w / h;
    const want: SkinId =
      ratio > ORIENT_THRESHOLD ? "landscape" :
        ratio < 1 / ORIENT_THRESHOLD ? "portrait" :
          this.#currentId; // どっちつかずは現状維持

    return want;
  }

  public set(skinId: SkinId) {
    if (skinId === this.#currentId) {
      return false;
    }

    this.#currentId = skinId;
    return true;
  }

  public update(w: number, h: number) {
    return this.set(this.decide(w, h));
  }
}

// 仮想ゲーム機の設定
export const skins: Skin[] = [
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
        width: 410,
        height: 360,
      },
      // 位置
      position: {
        x: 428,
        y: 84,
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
            y: 220,
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
            y: 300,
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
            y: 130,
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
