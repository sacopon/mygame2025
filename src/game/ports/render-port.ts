import { ViewHandle, Transform2D } from "@game/ports";

/**
 * スプライト用の指定
 */
export interface SpriteSpec {
  /** 画像名(アトラスのキー) */
  imageId: string;
  /** 位置情報 */
  transform?: Partial<Transform2D>;
  /** 描画優先度 */
  layer?: number;
  /** 原点 */
  anchor?: {
    x?: number,
    y?: number,
  },
  /** 表示/非表示フラグ */
  visible?: boolean;
}

/**
 * Nine-Slice スプライト用の指定
 */
export type NineSliceSpriteSpec = SpriteSpec & {
  /** 四隅の情報 */
  border: {
    /** 四隅部分の左側の幅 */
    left: number;
    /** 四隅部分の右側の幅 */
    right: number;
    /** 四隅部分の上側の高さ */
    top: number;
    /** 四隅部分の下側の高さ */
    bottom: number;
  };

  /** 大きさ */
  size: {
    /** 幅 */
    width: number;
    /** 高さ */
    height: number;
  };
}

/**
 * テキスト表示の文字スタイルの指定
 */
export interface TextStyleSpec {
  fontFamily?: string;   // 例: "Noto Sans JP"
  fontSize?: number;     // px
  fill?: number;         // 0xffffff
  align?: "left" | "center" | "right";
  wordWrap?: boolean;    // デフォルト true にしてもOK
  wordWrapWidth?: number;
}

/**
 * テキスト表示用の指定
 */
export interface TextSpec {
  /** 表示する文字列 */
  text: string;
  /** 位置情報 */
  transform?: Partial<Transform2D>;
  /** 描画優先度 */
  layer?: number;
  /** 表示/非表示フラグ */
  visible?: boolean;
  /** 文字スタイル情報 */
  style?: TextStyleSpec;
}

export interface RenderPort {
  /**
   * スプライトを生成し、そのスプライトへアクセスするためのハンドルを返す
   *
   * @param spec スプライトの仕様
   * @returns スプライトのハンドル
   */
  createSprite(spec: SpriteSpec): ViewHandle;

  /**
   * Nine-Slice スプライトを生成し、そのスプライトへアクセスするためのハンドルを返す
   *
   * @param spec Nine-Slice スプライトの仕様
   * @returns スプライトのハンドル
   */
  createNineSliceSprite(spec: NineSliceSpriteSpec): ViewHandle;

  /**
   * Nine-Slice スプライトのサイズを設定する
   *
   * @param handle スプライトのハンドル
   * @param size サイズ
   * @param size.width 幅
   * @param size.height 高さ
   * @returns スプライト
   */
  setNineSpriteSize(handle: ViewHandle, size: { width: number, height: number }): void;

  setSpriteTransform(handle: ViewHandle, transform: Partial<Transform2D>): void;
  setSpriteVisible?(view: ViewHandle, visible: boolean): void;
  setSpriteLayer?(view: ViewHandle, layer: number): void;
  destroyView(view: ViewHandle): void;

  // テキスト描画
  createText(spec: TextSpec): ViewHandle;
  setTextContent(handle: ViewHandle, text: string): void;
  setTextStyle?(handle: ViewHandle, style: Partial<TextStyleSpec>): void;
}
