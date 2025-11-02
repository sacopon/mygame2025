import { Container, Graphics } from "pixi.js";

export class ScreenTouchHandler extends Container {
  #rect: Graphics;

  constructor(onTouch: () => void) {
    super();

    const rect = new Graphics();
    rect.rect(0, 0, 0, 0);
    rect.fill({ color: 0xFFFFFF, alpha: 0 });
    rect.interactive = true;
    rect.on("pointerdown", () => {
      onTouch();
    });

    this.addChild(rect);
    this.#rect = rect;
  }

  onResize(w: number, h: number): void {
    this.#rect.clear();
    this.#rect.rect(0, 0, w, h);
    this.#rect.fill({ color: 0xFFFFFF, alpha: 0 });
  }

  setEnable(enable: boolean) {
    this.visible = enable;
  }
}
