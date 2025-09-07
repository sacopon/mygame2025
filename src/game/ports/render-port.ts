import { SpriteHandle, Transform2D } from "@game/ports";

export interface SpriteSpec {
  imageId: string;
  transform?: Partial<Transform2D>;
  layer?: number;
  visible?: boolean;
}

export interface RenderPort {
  /**
   * スプライトを生成し、そのスプライトへアクセスするためのハンドルを返す
   *
   * @param spec スプライトの仕様
   * @returns スプライトのハンドル
   */
  createSprite(spec: SpriteSpec): SpriteHandle;

  setSpriteTransform(handle: SpriteHandle, transform: Partial<Transform2D>): void;
  setSpriteVisible?(view: SpriteHandle, visible: boolean): void;
  setSpriteLayer?(view: SpriteHandle, layer: number): void;
  destroyView(view: SpriteHandle): void;
}
