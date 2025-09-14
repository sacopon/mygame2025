import { GameComponent, GameObject } from "@game/core";
import { TextStyleSpec, ViewHandle } from "@game/ports";

/**
 * 複数行のテキストから成るコンポーネント
 */
export class TextListComponent implements GameComponent<typeof TextListComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("TextListComponent");
  readonly typeId: typeof TextListComponent.typeId = TextListComponent.typeId;

  #handles: ViewHandle[] = [];
  #lines: string[] = [];
  #style: TextStyleSpec;
  #layout = { offsetX: 0, offsetY: 0, lineHeight: 14 };

  public constructor(lines: string[], style?: Partial<TextStyleSpec>, layout?: { offsetX?: number, offsetY?: number, lineHeight?: number }) {
    this.#lines = lines.slice();
    this.#style = {
      fontFamily: "sans-serif",
      fontSize: 20,
      fill: 0xFFFFFF,
      align: "left",
      wordWrap: true,
      wordWrapWidth: 300,
      ...style,
    };

    this.#layout = {
      offsetX: layout?.offsetX ?? 0,
      offsetY: layout?.offsetY ?? 0,
      lineHeight: layout?.lineHeight ?? 14,
    };
  }

  public update(gameObject: GameObject, _deltaTime: number): void {
    this.#handles.forEach((handle, i) => {
      gameObject.render.setSpriteTransform(handle, {
        x: gameObject.transform.x + this.#layout.offsetX,
        y: gameObject.transform.y + this.#layout.offsetY + this.#layout.lineHeight * i,
      });
    });
  }

  public onAttach(gameObject: GameObject): void {
    this.#handles = this.#createAllLines(gameObject);
  }

  public onDetach(gameObject: GameObject): void {
    for (let handle of this.#handles) {
      gameObject.render.destroyView(handle);
    }

    this.#handles = [];
  }

  #createAllLines(gameObject: GameObject) {
    return this.#lines.map(line =>
      gameObject.render.createText({
        text: line,
        style: this.#style,
      }));
  }
}

declare module "@game/component/component-registry" {
  interface ComponentRegistry {
    [TextListComponent.typeId]: TextListComponent;
  }
}
