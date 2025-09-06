import { Container, Sprite } from "pixi.js";
import { identityTransform, RenderPort, SpriteHandle, SpriteSpec, Transform2D } from "@game/ports";

/**
 * pixi.js 実装の RenderAdapter
 */
export class PixiRenderAdapter implements RenderPort {
  #rootContainer: Container;
  #views = new Map<SpriteHandle, Sprite>();
  #idCounter = 0;

  public constructor(rootContainer: Container) {
    this.#rootContainer = rootContainer;
  }

  public createSprite(spec: SpriteSpec): SpriteHandle {
    // 指定のアトラスキーから Sprite を作成
    // (事前にロードされているものとする)
    const sprite = Sprite.from(spec.imageId);

    // Transform2D を適用(指定がなければ identityTransform)
    const transform: Transform2D = { ...identityTransform, ...spec.transform };
    this.applyTransform(sprite, transform);

    // 回転時の中心点
    sprite.anchor.set(0.5);

    // 表示順
    sprite.zIndex = spec.layer ?? 0;
    sprite.visible = spec.visible ?? true;

    this.#rootContainer.addChild(sprite);

    // ハンドル生成
    const handle = `sprite-${this.#idCounter++}`;
    this.#views.set(handle, sprite);

    return handle;
  }

  public setSpriteTransform(handle: SpriteHandle, transform: Partial<Transform2D>): void {
    const sprite = this.#views.get(handle);

    if (!sprite) {
      return;
    }

    this.applyTransform(sprite, transform);
  }

  public setSpriteVisible?(view: SpriteHandle, visible: boolean): void {
    throw new Error("Method not implemented.");
  }

  public setSpriteLayer?(view: SpriteHandle, layer: number): void {
    throw new Error("Method not implemented.");
  }

  public destroyView(view: SpriteHandle): void {
    throw new Error("Method not implemented.");
  }

  private applyTransform(sprite: Sprite, transform: Partial<Transform2D>) {
    sprite.x = transform.x ?? sprite.x;
    sprite.y = transform.y ?? sprite.y;
    sprite.rotation = transform.rotation ?? sprite.rotation;
    sprite.scale.set(transform.scaleX ?? sprite.scale.x, transform.scaleY ?? sprite.scale.y);
  }
}
