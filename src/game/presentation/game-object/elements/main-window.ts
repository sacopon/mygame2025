import { GroupGameObject } from "../../core/group-game-object";
import { GameObject } from "../../core/game-object";
import { EnemyView } from "./enemy-view";
import { DEFAULT_WINDOW_SETTINGS } from ".";
import { GamePorts, NineSliceSpriteComponent, ScreenSizeAware, SpriteComponent } from "../..";
import { GAME_SCREEN } from "@app";

const enemyBottomY = 32;

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

class EnemyLayer extends GroupGameObject {
  #enemyViews: EnemyView[] = [];

  constructor(ports: GamePorts) {
    super(ports);
  }

  addEnemy(enemyView: EnemyView): void {
    this.addChild(enemyView);
    this.#enemyViews.push(enemyView);
    this.#replace();
  }

  #replace(): void {
    const totalWidth = this.#enemyViews.reduce((prev, current) => prev + current.width, 0);
    let x = -totalWidth / 2;

    for (const view of this.#enemyViews) {
      view.setPosition(x + (view.width / 2) | 0 , enemyBottomY);
      x += view.width;
    }
  }
}

export class MainWindow extends GroupGameObject implements ScreenSizeAware {
  static readonly #windowSpec = {
    width: GAME_SCREEN.WIDTH + DEFAULT_WINDOW_SETTINGS.borderWidth * 2 + 4, // 最後の +4 はウィンドウの端が見えないようにやや余裕を持たせるため
    height: 136,
  } as const;

  #border: Border;
  #enemyLayer: EnemyLayer;

  constructor(ports: GamePorts, backgroundImageId: string) {
    super(ports);

    this.addChild(new Background(ports, backgroundImageId));
    this.#border = this.addChild(new Border(ports, MainWindow.#windowSpec));
    this.#enemyLayer = this.addChild(new EnemyLayer(ports));
  }

  addEnemy(enemyView: EnemyView): void {
    this.#enemyLayer.addEnemy(enemyView);
  }

  shake(offset: { dx: number, dy: number }): void {
    this.#border.setPosition(this.x + offset.dx, this.y + offset.dy);
  }
}
