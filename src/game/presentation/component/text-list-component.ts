import { BaseGameComponent } from "@game/presentation/core/game-component";
import { TextStyle, ViewHandle } from "@game/presentation/ports";
import { GameObject } from "@game/presentation";

/**
 * 複数行のテキストから成るコンポーネント
 */
export class TextListComponent extends BaseGameComponent<typeof TextListComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("TextListComponent");
  readonly typeId: typeof TextListComponent.typeId = TextListComponent.typeId;

  #handles: ViewHandle[] = [];
  #lines: string[] = [];
  #style: TextStyle;
  #anchor: { x: number, y: number };
  #layout = { offsetX: 0, offsetY: 0, lineHeight: 14 };
  #visible: boolean = true;

  constructor(lines: ReadonlyArray<string>, options: { style?: Partial<TextStyle>, anchor?: { x?: number, y?: number }, layout?: { offsetX?: number, offsetY?: number, lineHeight?: number } } = {}) {
    super();
    this.#lines = lines.slice();
    this.#style = {
      fontFamily: "sans-serif",
      fontSize: 20,
      color: 0xFFFFFF,
      align: "left",
      wordWrap: true,
      wordWrapWidth: 300,
      ...options.style,
    };

    this.#anchor = {
      x: options.anchor?.x ?? 0.0,
      y: options.anchor?.y ?? 0.0,
    };

    this.#layout = {
      offsetX: options.layout?.offsetX ?? 0,
      offsetY: options.layout?.offsetY ?? 0,
      lineHeight: options.layout?.lineHeight ?? 14,
    };
  }

  update(gameObject: GameObject, _deltaTime: number): void {
    this.#handles.forEach((handle, i) => {
      gameObject.render.setTransform(handle, {
        x: gameObject.worldTransform.x + this.#layout.offsetX,
        y: gameObject.worldTransform.y + this.#layout.offsetY + this.#layout.lineHeight * i,
      });

      gameObject.render.setVisible(handle, this.#visible);
    });
  }

  override get visible(): boolean {
    return this.#visible;
  }

  override set visible(value: boolean) {
    this.#visible = value;
  }

  protected override onAttached(): void {
    this.#handles = this.#createAllLines(this.owner);
  }

  protected override onDetached(): void {
    for (let handle of this.#handles) {
      this.owner.render.destroyView(handle);
    }

    this.#handles = [];
  }

  get lines() {
    return this.#lines.concat();
  }

  setLine(index: number, text: string): void {
    if (index < 0 || this.#handles.length <= index) {
      console.warn(`範囲外テキスト:${index}`);
      return;
    }

    this.#lines[index] = text;
    this.owner.ports.render.setTextContent(this.#handles[index], text);
  }

  setColor(color: number): void {
    this.#handles.forEach(handle => {
      this.owner.ports.render.setTextStyle(handle, { color });
    });
  }

  bringToTop(): void {
    this.#handles.forEach(handle => {
      this.owner.render.bringToTop(handle);
    });
  }

  #createAllLines(gameObject: GameObject) {
    return this.#lines.map(line => gameObject.render.createText({
      text: line,
      style: this.#style,
      anchor: this.#anchor,
    }));
  }
}

declare module "@game/presentation/component/component-registry" {
  interface ComponentRegistry {
    [TextListComponent.typeId]: TextListComponent;
  }
}
