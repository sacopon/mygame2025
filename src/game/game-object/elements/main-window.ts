import { ScreenSizeAware } from "../../core/game-component";
import { GameObject } from "../../core/game-object";
import { NineSliceSpriteComponent } from "@game/component";
import { GamePorts } from "@game/core";

export class MainWindow extends GameObject implements ScreenSizeAware {
  constructor(ports: GamePorts, vw: number, vh: number) {
    super(ports);

    const pos = this.#calcPosition(vw, vh);
    this.setPosition(pos.x, pos.y);
    this.addComponent(new NineSliceSpriteComponent({
      imageId: "window.png",
      border: { left: 8, top: 8, right: 8, bottom: 8 },
      size: this.#calcSize(),
      anchor: { x: 0.5, y: 0.5 },
    }));
  }

  onScreenSizeChanged(vw: number, vh: number) {
    const pos = this.#calcPosition(vw, vh);
    this.setPosition(pos.x, pos.y);

    const size = this.#calcSize();
    this.getComponent(NineSliceSpriteComponent.typeId)!.setSize(size.width, size.height);
  }

  #calcPosition(vw: number, vh: number): { x: number, y: number } {
    return {
      x: (vw / 2) | 0,
      y: (vh / 2) - 18 | 0,
    };
  }

  #calcSize(): { width: number, height: number } {
    return {
      width: 256 + 8, // TODO: ウィンドウ枠の内側角が見えてしまっているのをどうにかしたい
      height: 136,
    };
  }
}
