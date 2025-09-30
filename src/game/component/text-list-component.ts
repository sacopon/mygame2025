import { GameComponent, GameObject } from "@game/core";
import { TextStyle, ViewHandle } from "@game/ports";

/**
 * 複数行のテキストから成るコンポーネント
 */
export class TextListComponent implements GameComponent<typeof TextListComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("TextListComponent");
  readonly typeId: typeof TextListComponent.typeId = TextListComponent.typeId;

  #handles: ViewHandle[] = [];
  #lines: string[] = [];
  #style: TextStyle;
  #layout = { offsetX: 0, offsetY: 0, lineHeight: 14 };

  constructor(lines: string[], style?: Partial<TextStyle>, layout?: { offsetX?: number, offsetY?: number, lineHeight?: number }) {
    this.#lines = lines.slice();
    this.#style = {
      fontFamily: "sans-serif",
      fontSize: 20,
      color: 0xFFFFFF,
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

  update(gameObject: GameObject, _deltaTime: number): void {
    this.#handles.forEach((handle, i) => {
      gameObject.render.setSpriteTransform(handle, {
        x: gameObject.transform.x + this.#layout.offsetX,
        y: gameObject.transform.y + this.#layout.offsetY + this.#layout.lineHeight * i,
      });
    });
  }

  onAttach(gameObject: GameObject): void {
    this.#handles = this.#createAllLines(gameObject);
  }

  onDetach(gameObject: GameObject): void {
    for (let handle of this.#handles) {
      gameObject.render.destroyView(handle);
    }

    this.#handles = [];
  }

  get lines() {
    return this.#lines.concat();
  }

  #createAllLines(gameObject: GameObject) {
    return this.#lines.map(line => gameObject.render.createText({
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
