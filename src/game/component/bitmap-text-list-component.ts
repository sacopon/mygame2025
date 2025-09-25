import { GameComponent, GameObject } from "@game/core";
import { TextStyle, ViewHandle } from "@game/ports";

const fontSpaceAdjustX = 0;  // フォントの問題で余白が大きいのでその調整
const fontSpaceAdjustY = -12;  // フォントの問題で余白が大きいのでその調整

/**
 * 複数行のテキストから成るコンポーネント
 */
export class BitmapTextListComponent implements GameComponent<typeof BitmapTextListComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("BitmapTextListComponent");
  readonly typeId: typeof BitmapTextListComponent.typeId = BitmapTextListComponent.typeId;

  #handles: ViewHandle[] = [];
  #lines: string[] = [];
  #style: TextStyle;
  #layout = { offsetX: 0, offsetY: 0, lineHeight: 14 };

  public constructor(lines: string[], style?: Partial<TextStyle>, layout?: { offsetX?: number, offsetY?: number, lineHeight?: number }) {
    this.#lines = lines.slice();
    this.#style = {
      fontSize: 8,
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

  public update(gameObject: GameObject, _deltaTime: number): void {
    this.#handles.forEach((handle, i) => {
      gameObject.render.setSpriteTransform(handle, {
        x: gameObject.transform.x + fontSpaceAdjustX + this.#layout.offsetX,
        y: gameObject.transform.y + fontSpaceAdjustY + this.#layout.offsetY + this.#layout.lineHeight * i,
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
      gameObject.render.createBitmapText({
        text: line,
        style: this.#style,
      }));
  }
}

declare module "@game/component/component-registry" {
  interface ComponentRegistry {
    [BitmapTextListComponent.typeId]: BitmapTextListComponent;
  }
}
