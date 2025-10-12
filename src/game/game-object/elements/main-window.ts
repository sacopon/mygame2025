import { GAME_SCREEN } from "@app/config";
import { ScreenSizeAware } from "../../core/game-component";
import { GameObject } from "../../core/game-object";
import { NineSliceSpriteComponent } from "@game/component";
import { GamePorts } from "@game/core";
import { DEFAULT_WINDOW_SETTINGS } from "./window";

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
      y: (vh / 2) - 28 | 0,
    };
  }

  #calcSize(): { width: number, height: number } {
    return {
      width: GAME_SCREEN.WIDTH + DEFAULT_WINDOW_SETTINGS.borderWidth * 2 + 4, // 最後の +4 はウィンドウの端が見えないようにやや余裕を持たせるため
      height: 136,
    };
  }
}
