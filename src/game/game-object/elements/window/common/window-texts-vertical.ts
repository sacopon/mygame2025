import { TextListComponent } from "@game/component";
import { GameObject, GamePorts } from "@game/core";

export class WindowTextsVertical extends GameObject {
  #textList: TextListComponent;
  #lineHeight: number;

  constructor(ports: GamePorts, texts: ReadonlyArray<string>, style: { fontFamily: string, fontSize: number, lineHeight: number }) {
    super(ports);
    this.#lineHeight = style.lineHeight;

    this.setPosition(0, 0);
    this.#textList = this.addComponent(new TextListComponent(
      texts,
      {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
      },
      {
        lineHeight: this.#lineHeight,
      }))!;
  }

  get textLines() {
    return this.#textList.lines.concat();
  }

  getLineMidY(index: number) {
    const top = this.transform.y;
    return top + this.#lineHeight * index + Math.floor(this.#lineHeight / 2);
  }
}
