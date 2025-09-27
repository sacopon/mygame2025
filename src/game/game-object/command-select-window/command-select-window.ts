import {  NineSliceSpriteComponent, RectComponent, TextListComponent } from "@game/component";
import { GameObject, GamePorts } from "@game/core";

const fontSize = 10;
const borderWidth = 4;
const borderHeight = 4;
const marginTop = 4;
const marginBottom = 4;
const marginLeft = 4;
const marginRight = 4;
const maxCharCount = 5;
const lineMargin = Math.floor(fontSize * 0.5);
const lineHeight = fontSize + lineMargin;
const maxLines = 4;

export class CommandSelectWindow extends GameObject {
  #panel: NineSliceSpriteComponent;
  #textList: TextListComponent;
  #windowSpec = {
    // 位置は UILayoutCoordinator が決定する
    x: 0,
    y: 0,
    width: borderWidth + marginLeft + fontSize * maxCharCount + marginRight + borderWidth,
    height: borderHeight + marginTop + lineHeight * maxLines  - lineMargin + marginBottom + borderHeight,
  };

  constructor(ports: GamePorts, _vw: number, _vh: number) {
    super(ports);

    this.setPosition(this.#windowSpec.x, this.#windowSpec.y);

    // ウィンドウ背景
    this.addComponent(new RectComponent({
      size: {
        width: this.#windowSpec.width,
        height: this.#windowSpec.height,
      },
      color: 0x000000,
      alpha: 0.75, // 濃いめ
    }));

    // ウィンドウ枠
    this.#panel = this.addComponent(new NineSliceSpriteComponent({
      imageId: "window.png",
      border: { left: 8, top: 8, right: 8, bottom: 8 },
      size: { width: this.#windowSpec.width, height: this.#windowSpec.height },
    }))!;

    // 中身
    this.#textList = this.addComponent(new TextListComponent(
      ["たたかう", "ぼうぎょ", "じゅもん", "どうぐ"],
      { fontFamily: "BestTen", fontSize: 10, },
      {
        offsetX: borderWidth + marginLeft + fontSize,
        offsetY: borderHeight + marginTop,
        lineHeight,
      }))!;
  }

  getWidth(): number {
    return this.#windowSpec.width;
  }

  getHeight(): number {
    return this.#windowSpec.height;
  }
}
