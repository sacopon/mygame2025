import { GameComponent, GameObject } from "@game/core";
import { TextSpec, TextStyleSpec, ViewHandle } from "@game/ports";

export class TextComponent implements GameComponent<typeof TextComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("TextComponent");
  readonly typeId: typeof TextComponent.typeId = TextComponent.typeId;

  #handle: ViewHandle | null = null;
  #text: string = "";
  #style: TextStyleSpec;

  public constructor(text: string, style?: Partial<TextStyleSpec>) {
    this.#text = text;
    this.#style = {
      fontFamily: "sans-serif",
      fontSize: 20,
      fill: 0xFFFFFF,
      align: "left",
      wordWrap: true,
      wordWrapWidth: 300,
      ...style,
    };
  }

  public update(gameObject: GameObject, _deltaTime: number): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.setSpriteTransform(this.#handle, gameObject.transform);
  }

  public onAttach(gameObject: GameObject): void {
    const spec: TextSpec = {
      text: this.#text,
      style: this.#style,
    };

    this.#handle = gameObject.render.createText(spec);
  }

  public onDetach(gameObject: GameObject): void {
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
