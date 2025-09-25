import { SpriteComponent } from "@game/component";
import { GameObject, GamePorts, ScreenSizeAware } from "@game/core";

export class Background extends GameObject implements ScreenSizeAware {
  constructor(ports: GamePorts, vw: number, vh: number) {
    super(ports);

    const x = vw / 2;
    const y = vh / 2;
    this.setPosition(x, y);
    // this.addComponent(new SpriteComponent("bg358x224.png"));
    this.addComponent(new SpriteComponent({
      imageId: "fieldbgsample.png",
      anchor: { x: 0.5, y: 0.5 },
    }));
  }

  onScreenSizeChanged(width: number, height: number) {
    this.setPosition(width / 2, height / 2);
  }
}
