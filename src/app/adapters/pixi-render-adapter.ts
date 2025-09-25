import { BitmapText, Container, Graphics, NineSliceSprite, Sprite, Text, Texture, TextStyle as PixiTextStyle } from "pixi.js";
import { identityTransform, NineSliceSpriteSpec, RenderPort, ViewHandle, SpriteSpec, TextSpec, Transform2D, RectSpec, TextStyle } from "@game/ports";

const defaultFontSetting = Object.freeze({
  fontFamily: "BestTen",
  fontSize: 10,
  color: 0xFFFFFF,
  align: "left",
  wordWrap: false,
  wordWrapWidth: 300,
});

const textInternalScaleRatio = 4;

/**
 * pixi.js 実装の RenderAdapter
 */
export class PixiRenderAdapter implements RenderPort {
  #rootContainer: Container;
  #views = new Map<ViewHandle, Sprite | NineSliceSprite | Text | BitmapText | Graphics>();
  #idCounter = 0;

  public constructor(rootContainer: Container) {
    this.#rootContainer = rootContainer;
  }
  createSprite(spec: SpriteSpec): ViewHandle {
    // 指定のアトラスキーから Sprite を作成
    // (事前にロードされているものとする)
    const sprite = Sprite.from(spec.imageId);

    // Transform2D を適用(指定がなければ identityTransform)
    const transform: Transform2D = { ...identityTransform, ...spec.transform };
    this.#applyTransform(sprite, transform);

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
    this.#applyTransform(sprite, transform);

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

  createText(spec: TextSpec): ViewHandle {
    const style: Partial<PixiTextStyle> = {
      fontFamily:    spec.style?.fontFamily    ?? defaultFontSetting.fontFamily,
      fontSize:      (spec.style?.fontSize     ?? defaultFontSetting.fontSize) * textInternalScaleRatio,
      fill:          spec.style?.color         ?? defaultFontSetting.color,
      align:         spec.style?.align         ?? defaultFontSetting.align,
    };

    if (spec.style?.wordWrapWidth) {
      style.wordWrapWidth = spec.style.wordWrapWidth;
    }

    const t = new Text({ text: spec.text, style });

    // transform を反映（anchor があるので 0.5/0.5 で中央基準も可）
    const tr = { ...identityTransform, ...spec.transform };
    this.#applyTransform(t, tr);

    t.scale.set(1 / textInternalScaleRatio);
    t.resolution = 2;
    t.zIndex = spec.layer ?? 0;
    t.visible = spec.visible ?? true;
    this.#rootContainer.addChild(t);

    const handle = `text-${this.#idCounter++}`;
    this.#views.set(handle, t);
    return handle;
  }

  setTextContent(handle: ViewHandle, text: string): void {
    const n = this.#views.get(handle);
    if (n && n instanceof Text) {
      n.text = text;
    }
  }

  setTextStyle(handle: ViewHandle, style: Partial<TextStyle>): void {
    const n = this.#views.get(handle);

    if (!(n && n instanceof Text)) return;
    if (style.fontFamily !== undefined) n.style.fontFamily = style.fontFamily;
    if (style.fontSize   !== undefined) n.style.fontSize   = style.fontSize;
    if (style.color      !== undefined) n.style.fill       = style.color;
    if (style.align      !== undefined) n.style.align      = style.align;
    if (style.wordWrap   !== undefined) n.style.wordWrap   = style.wordWrap;
    if (style.wordWrapWidth !== undefined) n.style.wordWrapWidth = style.wordWrapWidth;
  }

  createBitmapText(spec: TextSpec): ViewHandle {
    const style = {
      fontFamily:    spec.style?.fontFamily    ?? defaultFontSetting.fontFamily,
      fontSize:      (spec.style?.fontSize     ?? defaultFontSetting.fontSize) * textInternalScaleRatio,
      fill:          spec.style?.color         ?? defaultFontSetting.color,
      align:         spec.style?.align         ?? defaultFontSetting.align,
      wordWrap:      spec.style?.wordWrap      ?? defaultFontSetting.wordWrap,
      wordWrapWidth: spec.style?.wordWrapWidth ?? defaultFontSetting.wordWrapWidth,
    };
    const t = new BitmapText({ text: spec.text, style });

    // transform を反映（anchor があるので 0.5/0.5 で中央基準も可）
    const tr = { ...identityTransform, ...spec.transform };
    this.#applyTransform(t, tr);

    t.zIndex = spec.layer ?? 0;
    t.visible = spec.visible ?? true;
    this.#rootContainer.addChild(t);


    const handle = `bitmaptext-${this.#idCounter++}`;
    this.#views.set(handle, t);

let n: any = t;
let sy = 1;
while (n) { sy *= n.scale?.y ?? 1; n = n.parent; }
console.log("effective scaleY=", sy);

    return handle;
  }

  setBitmapTextContent(handle: ViewHandle, text: string): void {
    const n = this.#views.get(handle);
    if (n && n instanceof BitmapText) {
      n.text = text;
    }

let nn: any = n;
let sy = 1;
while (nn) { sy *= nn.scale?.y ?? 1; nn = nn.parent; }
console.log("effective scaleY=", sy);
  }

  setBitmapTextStyle?(handle: ViewHandle, style: Partial<TextStyle>): void {
    const n = this.#views.get(handle);

    if (!(n && n instanceof BitmapText)) return;
    // BitmapText の場合、あとから fontFamily を変えることはできない(必要であれば作り直す)
    if (style.fontSize   !== undefined) n.style.fontSize   = style.fontSize;
    if (style.color      !== undefined) n.style.fill       = style.color;
    if (style.align      !== undefined) n.style.align      = style.align;
    if (style.wordWrap   !== undefined) n.style.wordWrap   = style.wordWrap;
    if (style.wordWrapWidth !== undefined) n.style.wordWrapWidth = style.wordWrapWidth;
  }

  createRect(spec: RectSpec): ViewHandle {
    const g = new Graphics();
    g.eventMode = "none";
    g.rect(
      spec.transform?.x ?? 0,
      spec.transform?.y ?? 0,
      spec.size.width,
      spec.size.height);
    g.alpha = spec.alpha ?? 1.0;
    g.fill(spec.color ?? 0xFFFFFF);

    // 表示順
    g.zIndex = spec.layer ?? 0;
    g.visible = spec.visible ?? true;

    this.#rootContainer.addChild(g);

    // ハンドル生成
    const handle = `graphics-${this.#idCounter++}`;
    this.#views.set(handle, g);

    return handle;
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

  setSpriteTransform(handle: ViewHandle, transform: Partial<Transform2D>): void {
    const sprite = this.#views.get(handle);

    if (!sprite) {
      return;
    }

    this.#applyTransform(sprite, transform);
  }

  setSpriteVisible?(_view: ViewHandle, _visible: boolean): void {
    throw new Error("Method not implemented.");
  }

  setSpriteLayer?(_view: ViewHandle, _layer: number): void {
    throw new Error("Method not implemented.");
  }

  destroyView(_view: ViewHandle): void {
    throw new Error("Method not implemented.");
  }

  #applyTransform(sprite: Sprite | NineSliceSprite | Text | BitmapText | Graphics, transform: Partial<Transform2D>) {
    sprite.x = transform.x ?? sprite.x;
    sprite.y = transform.y ?? sprite.y;
    sprite.rotation = transform.rotation ?? sprite.rotation;
    sprite.scale.set(transform.scaleX ?? sprite.scale.x, transform.scaleY ?? sprite.scale.y);
  }
}
