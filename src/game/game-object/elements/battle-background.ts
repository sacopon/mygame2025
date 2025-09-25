import { SpriteComponent } from "@game/component";
import { GameObject, GamePorts, ScreenSizeAware } from "@game/core";

export class BattleBackground extends GameObject implements ScreenSizeAware {
  constructor(ports: GamePorts, vw: number, vh: number) {
    super(ports);

    const x = vw / 2;
    const y = vh / 2 - 18;
    this.setPosition(x, y);
    this.addComponent(new SpriteComponent({
      imageId: "bgsample.png",
      anchor: { x: 0.5, y: 0.5 },
    }));
  }

  onScreenSizeChanged(vw: number, vh: number) {
    this.setPosition(vw / 2, vh / 2 - 18);
  }
}
