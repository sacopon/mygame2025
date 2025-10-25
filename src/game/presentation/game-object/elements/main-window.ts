import { GroupGameObject } from "../../core/group-game-object";
import { GameObject } from "../../core/game-object";
import { DEFAULT_WINDOW_SETTINGS } from ".";
import { GamePorts, NineSliceSpriteComponent, ScreenSizeAware, SpriteComponent } from "../..";
import { GAME_SCREEN } from "@app/config";

class Background extends GameObject {
  constructor(ports: GamePorts, imageId: string) {
    super(ports);

    this.addComponent(new SpriteComponent({
      imageId,
      anchor: { x: 0.5, y: 0.5 },
    }));
  }
}

class Border extends GameObject {
  constructor(ports: GamePorts, size: { width: number, height: number }) {
    super(ports);

    this.addComponent(new NineSliceSpriteComponent({
      imageId: "window.png",
      border: { left: 8, top: 8, right: 8, bottom: 8 },
      size,
      anchor: { x: 0.5, y: 0.5 },
    }));
  }
}

export class MainWindow extends GroupGameObject implements ScreenSizeAware {
  static readonly #windowSpec = {
    width: GAME_SCREEN.WIDTH + DEFAULT_WINDOW_SETTINGS.borderWidth * 2 + 4, // 最後の +4 はウィンドウの端が見えないようにやや余裕を持たせるため
    height: 136,
  } as const;

  constructor(ports: GamePorts, backgroundImageId: string) {
    super(ports);

    this.addChild(new Background(ports, backgroundImageId));
    this.addChild(new Border(ports, MainWindow.#windowSpec));
    const { width, height } = this.ports.screen.getGameSize();
    const pos = this.#calcPosition(width, height);
    this.setPosition(pos.x, pos.y);
  }

  override onScreenSizeChanged() {
    super.onScreenSizeChanged();
    const { width, height } = this.ports.screen.getGameSize();
    const pos = this.#calcPosition(width, height);
    this.setPosition(pos.x, pos.y);
  }

  #calcPosition(vw: number, vh: number): { x: number, y: number } {
    return {
      x: (vw / 2) | 0,
      y: (vh / 2) - 12 | 0,
    };
  }
}
