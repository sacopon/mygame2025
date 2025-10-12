import { GameComponent, GameObject } from "@game/core";
import { TextSpec, TextStyle, ViewHandle } from "@game/ports";

export class TextComponent implements GameComponent<typeof TextComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("TextComponent");
  readonly typeId: typeof TextComponent.typeId = TextComponent.typeId;

  #handle: ViewHandle | null = null;
  #text: string = "";
  #style: TextStyle;

  constructor(text: string, style?: Partial<TextStyle>) {
    this.#text = text;
    this.#style = {
      fontFamily: "sans-serif",
      fontSize: 20,
      color: 0xFFFFFF,
      align: "left",
      wordWrap: true,
      wordWrapWidth: 300,
      ...style,
    };
  }

  update(gameObject: GameObject, _deltaTime: number): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.setSpriteTransform(this.#handle, gameObject.transform);
  }

  onAttach(gameObject: GameObject): void {
    const spec: TextSpec = {
      text: this.#text,
      style: this.#style,
    };

    this.#handle = gameObject.render.createText(spec);
  }

  onDetach(gameObject: GameObject): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.destroyView(this.#handle);
    this.#handle = null;
  }
}

declare module "@game/component/component-registry" {
  interface ComponentRegistry {
    [TextComponent.typeId]: TextComponent;
  }
}
