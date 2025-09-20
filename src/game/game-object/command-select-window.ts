import { NineSliceSpriteComponent, RectComponent, TextListComponent } from "@game/component";
import { GameObject, GamePorts } from "@game/core";

const fontSize = 14;
const marginY = 4;
const borderWidth = 6;
const lineCount = 4;
const maxCharCount = 5;

export class CommandSelectWindow extends GameObject {
  #panel: NineSliceSpriteComponent;
  #textList: TextListComponent;
  #windowSpec = {
    // 位置は UILayoutCoordinator が決定する
    x: 0,
    y: 0,
    width: borderWidth + fontSize * maxCharCount + borderWidth,
    height: borderWidth + marginY + (fontSize + marginY) * lineCount + borderWidth,
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
      { fontSize: 12, },
      {
        offsetX: 4 + 2 + 14,
        offsetY: 4 + 2 + 4,
        lineHeight: 14 + 4,
      }))!;
  }

  getWidth(): number {
    return this.#windowSpec.width;
  }

  getHeight(): number {
    return this.#windowSpec.height;
  }
}
