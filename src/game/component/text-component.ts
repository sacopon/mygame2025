import { BaseGameComponent } from "@game/presentation/core/game-component";
import { TextSpec, TextStyle, ViewHandle } from "@game/ports";
import { GameObject } from "@game/presentation";

export class TextComponent extends BaseGameComponent<typeof TextComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("TextComponent");
  readonly typeId: typeof TextComponent.typeId = TextComponent.typeId;

  #handle: ViewHandle | null = null;
  #text: string = "";
  #style: TextStyle;
  #anchor: { x: number, y: number };

  constructor(text: string, options: { style?: Partial<TextStyle>; anchor?: { x?: number, y?: number } } = {}) {
    super();
    this.#text = text;
    this.#style = {
      fontFamily: "sans-serif",
      fontSize: 20,
      color: 0xFFFFFF,
      align: "left",
      wordWrap: true,
      wordWrapWidth: 300,
      ...(options.style ?? {}),
    };

    this.#anchor = {
      x: options.anchor?.x ?? 0.0,
      y: options.anchor?.y ?? 0.0,
    };
  }

  update(gameObject: GameObject, _deltaTime: number): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.setSpriteTransform(this.#handle, gameObject.transform);
  }

  protected override onAttached(): void {
    const spec: TextSpec = {
      text: this.#text,
      style: this.#style,
      anchor: this.#anchor,
      transform: {
        x: this.owner.transform.x,
        y: this.owner.transform.y,
      },
    };

    this.#handle = this.owner.render.createText(spec);
  }

  protected override onDetached(): void {
    if (!this.#handle) {
      return;
    }

    this.owner.render.destroyView(this.#handle);
    this.#handle = null;
  }

  get text() {
    return this.#text;
  }

  set text(s: string) {
    this.#text = s;

    if (!this.#handle) {
      return;
    }

    this.owner.render.setTextContent(this.#handle, this.#text);
  }
}

declare module "@game/component/component-registry" {
  interface ComponentRegistry {
    [TextComponent.typeId]: TextComponent;
  }
}
