import { Insets } from "@core/browser";
import { CanvasTextOptions, Container, Graphics, Text } from "pixi.js";

/**
 * ビルドバージョン表示ラベル
 */
export class BuildVersionText extends Container {
  #background: Graphics;
  #label: Text;

  constructor() {
    super();

    const options: CanvasTextOptions = {
      text: ` ${__BUILD_VERSION__} `,
      style: {
        align: "left",
        fill: 0xFFFFFF,
        fontSize: 14,
      },
    };

    const label = new Text(options);

    const g = new Graphics();
    g.rect(0, 0, Math.floor(label.width), Math.floor(label.height));
    g.fill({ color: 0 });

    this.addChild(g);
    this.addChild(label);

    this.#label = label;
    this.#background = g;
  }

  layoutToRightTop(screenWidth: number, screenHeight: number, safeAreaInsets: Insets) {
    this.position.set(
      Math.floor(screenWidth - safeAreaInsets.right - this.width),
      safeAreaInsets.top);
  }
}
