import { SpriteHandle, Transform2D } from "@game/ports";

export interface SpriteSpec {
  imageId: string;
  transform?: Partial<Transform2D>;
  layer?: number;
  visible?: boolean;
}

export type NineSliceSpriteSpec = SpriteSpec & {
  border: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  size: {
    width: number;
    height: number;
  };
}

export interface RenderPort {
  /**
   * スプライトを生成し、そのスプライトへアクセスするためのハンドルを返す
   *
   * @param spec スプライトの仕様
   * @returns スプライトのハンドル
   */
  createSprite(spec: SpriteSpec): SpriteHandle;

  /**
   * Nine-Slice スプライトを生成し、そのスプライトへアクセスするためのハンドルを返す
   *
   * @param spec Nine-Slice スプライトの仕様
   * @returns スプライトのハンドル
   */
  createNineSliceSprite(spec: NineSliceSpriteSpec): SpriteHandle;

  setNineSpriteSize(handle: SpriteHandle, size: { width: number, height: number }): void;

  setSpriteTransform(handle: SpriteHandle, transform: Partial<Transform2D>): void;
  setSpriteVisible?(view: SpriteHandle, visible: boolean): void;
  setSpriteLayer?(view: SpriteHandle, layer: number): void;
  destroyView(view: SpriteHandle): void;
}
