import { NineSliceSpriteComponent } from "@game/component";
import { GameObject, GamePorts, ScreenSizeAware } from "@game/core";

export class MainWindow extends GameObject implements ScreenSizeAware {
  constructor(ports: GamePorts, vw: number, vh: number) {
    super(ports);

    const pos = this.#calcPosition(vw, vh);
    this.setPosition(pos.x, pos.y);
    this.addComponent(new NineSliceSpriteComponent("window.png", { left: 4, top: 4, right: 4, bottom: 4 }, this.#calcSize(vw, vh)));
  }

  onScreenSizeChanged(vw: number, vh: number) {
    const pos = this.#calcPosition(vw, vh);
    this.setPosition(pos.x, pos.y);

    const size = this.#calcSize(vw, vh);
    this.getComponent(NineSliceSpriteComponent.typeId)!.setSize(size.width, size.height);
  }

  #calcPosition(vw: number, vh: number): { x: number, y: number } {
    return {
      x: (vw / 2) | 0,
      y: (vh / 2) - 18 | 0,
    };
  }

  #calcSize(_vw: number, _vh: number): { width: number, height: number } {
    return {
      width: 256 + 8,
      height: 136,
    };
  }
}
