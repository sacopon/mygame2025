import { Container, NineSliceSprite, Sprite, Text, TextStyle, Texture } from "pixi.js";
import { identityTransform, NineSliceSpriteSpec, RenderPort, ViewHandle, SpriteSpec, TextSpec, TextStyleSpec, Transform2D } from "@game/ports";

/**
 * pixi.js 実装の RenderAdapter
 */
export class PixiRenderAdapter implements RenderPort {
  #rootContainer: Container;
  #views = new Map<ViewHandle, Sprite | NineSliceSprite | Text>();
  #idCounter = 0;

  public constructor(rootContainer: Container) {
    this.#rootContainer = rootContainer;
  }

  public createSprite(spec: SpriteSpec): ViewHandle {
    // 指定のアトラスキーから Sprite を作成
    // (事前にロードされているものとする)
    const sprite = Sprite.from(spec.imageId);

    // Transform2D を適用(指定がなければ identityTransform)
    const transform: Transform2D = { ...identityTransform, ...spec.transform };
    this.applyTransform(sprite, transform);

    // 回転時の中心点
    sprite.anchor.set(spec.anchor?.x ?? 0, spec.anchor?.y ?? 0);

    // 表示順
    sprite.zIndex = spec.layer ?? 0;
    sprite.visible = spec.visible ?? true;

    this.#rootContainer.addChild(sprite);

    // ハンドル生成
    const handle = `sprite-${this.#idCounter++}`;
    this.#views.set(handle, sprite);

    return handle;
  }

  createNineSliceSprite(spec: NineSliceSpriteSpec): ViewHandle {
    const tex = Texture.from(spec.imageId);
    const sprite = new NineSliceSprite({
      texture: tex,
      leftWidth: spec.border.left,
      rightWidth: spec.border.right,
      topHeight: spec.border.top,
      bottomHeight: spec.border.bottom,
    });

    // 初期サイズ
    sprite.width = spec.size.width;
    sprite.height = spec.size.height;

    // Transform2D を適用(指定がなければ identityTransform)
    const transform: Transform2D = { ...identityTransform, ...spec.transform };
    this.applyTransform(sprite, transform);

    // 回転時の中心点
    sprite.anchor.set(spec.anchor?.x ?? 0, spec.anchor?.y ?? 0);

    // 表示順
    sprite.zIndex = spec.layer ?? 0;
    sprite.visible = spec.visible ?? true;

    this.#rootContainer.addChild(sprite);

    // ハンドル生成
    const handle = `sprite-${this.#idCounter++}`;
    this.#views.set(handle, sprite);

    return handle;
  }

  public createText(spec: TextSpec): ViewHandle {
    const style = new TextStyle({
      fontFamily: spec.style?.fontFamily ?? "sans-serif",
      fontSize:   spec.style?.fontSize   ?? 18,
      fill:       spec.style?.fill       ?? 0xffffff,
      align:      spec.style?.align      ?? "left",
      wordWrap:   spec.style?.wordWrap   ?? true,
      wordWrapWidth: spec.style?.wordWrapWidth ?? 300,
    });
    const t = new Text({ text: spec.text, style });

    // transform を反映（anchor があるので 0.5/0.5 で中央基準も可）
    const tr = { ...identityTransform, ...spec.transform };
    this.applyTransform(t, tr);

    t.zIndex = spec.layer ?? 0;
    t.visible = spec.visible ?? true;
    this.#rootContainer.addChild(t);

    const handle = `sprite-${this.#idCounter++}`;
    this.#views.set(handle, t);
    return handle;
  }

  public setTextContent(handle: ViewHandle, text: string): void {
    const n = this.#views.get(handle);
    if (n && n instanceof Text) {
      n.text = text;
    }
  }

  public setTextStyle(handle: ViewHandle, style: Partial<TextStyleSpec>): void {
    const n = this.#views.get(handle);

    if (!(n && n instanceof Text)) return;
    if (style.fontFamily !== undefined) n.style.fontFamily = style.fontFamily;
    if (style.fontSize   !== undefined) n.style.fontSize   = style.fontSize;
    if (style.fill       !== undefined) n.style.fill       = style.fill;
    if (style.align      !== undefined) n.style.align      = style.align;
    if (style.wordWrap   !== undefined) n.style.wordWrap   = style.wordWrap;
    if (style.wordWrapWidth !== undefined) n.style.wordWrapWidth = style.wordWrapWidth;
  }

  setNineSpriteSize(handle: ViewHandle, size: { width: number; height: number; }): void {
    const sprite = this.#views.get(handle);

    if (!sprite) {
      return;
    }

    if (!(sprite instanceof NineSliceSprite)) {
      return;
    }

    sprite.width = size.width;
    sprite.height = size.height;
  }

  public setSpriteTransform(handle: ViewHandle, transform: Partial<Transform2D>): void {
    const sprite = this.#views.get(handle);

    if (!sprite) {
      return;
    }

    this.applyTransform(sprite, transform);
  }

  public setSpriteVisible?(_view: ViewHandle, _visible: boolean): void {
    throw new Error("Method not implemented.");
  }

  public setSpriteLayer?(_view: ViewHandle, _layer: number): void {
    throw new Error("Method not implemented.");
  }

  public destroyView(_view: ViewHandle): void {
    throw new Error("Method not implemented.");
  }

  private applyTransform(sprite: Sprite | NineSliceSprite | Text, transform: Partial<Transform2D>) {
    sprite.x = transform.x ?? sprite.x;
    sprite.y = transform.y ?? sprite.y;
    sprite.rotation = transform.rotation ?? sprite.rotation;
    sprite.scale.set(transform.scaleX ?? sprite.scale.x, transform.scaleY ?? sprite.scale.y);
  }
}
