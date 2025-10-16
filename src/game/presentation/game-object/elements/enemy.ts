import { GameObject } from "../../core/game-object";
import { ScreenSizeAware } from "../../core/game-component";
import { SpriteComponent } from "@game/presentation/component";
import { GamePorts } from "@game/presentation";

export class Enemy extends GameObject implements ScreenSizeAware {
  #index: number;

  constructor(ports: GamePorts, vw: number, vh: number, index: number) {
    super(ports);

    this.#index = index;
    const pos = this.#calcPosition(vw, vh, this.#index);
    this.setPosition(pos.x, pos.y);
    this.addComponent(new SpriteComponent({
      imageId: "enemy24x24.png",
      anchor: { x: 0.5, y: 0.5 },
    }));
  }

  onScreenSizeChanged(vw: number, vh: number) {
    const pos = this.#calcPosition(vw, vh, this.#index);
    this.setPosition(pos.x, pos.y);
  }

  #calcPosition(vw: number, vh: number, index: number): { x: number, y: number } {
    const x = (vw / 2 - (24 * 8) / 2 + 12 + index * 24) | 0;
    const y = vh / 2;

    return { x, y };
  }
}
