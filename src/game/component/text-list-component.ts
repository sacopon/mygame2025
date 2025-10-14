import { BaseGameComponent } from "@game/presentation/core/game-component";
import { TextStyle, ViewHandle } from "@game/ports";
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
  #layout = { offsetX: 0, offsetY: 0, lineHeight: 14 };

  constructor(lines: ReadonlyArray<string>, style?: Partial<TextStyle>, layout?: { offsetX?: number, offsetY?: number, lineHeight?: number }) {
    super();
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
