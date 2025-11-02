import { Container, Graphics } from "pixi.js";

export class ScreenTouchHandler extends Container {
  constructor(onTouch: () => void) {
    super();

    const rect = new Graphics();
    rect.rect(0, 0, window.innerWidth, window.innerHeight);
    rect.fill({ color: 0xFFFFFF, alpha: 0.5 });
    rect.interactive = true;
    rect.on("pointerdown", () => {
      onTouch();
    });

    this.addChild(rect);
  }

  setEnable(enable: boolean) {
    this.visible = enable;
  }
}
