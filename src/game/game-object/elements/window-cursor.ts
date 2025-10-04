import { SpriteComponent } from "@game/component";
import { GameObject, GamePorts } from "@game/core";

/**
 * ウィンドウ内に表示する点滅カーソル
 * 初期状態では非表示なので setEnable(true) で表示状態にすること
 */
export class WindowCursor extends GameObject {
  #blinkCounter: number = 0;
  #enable: boolean = false;
  #sprite: SpriteComponent;

  static readonly settings = {
    blinkRate: 40,
    displayCount: 30,
  };

  constructor(ports: GamePorts) {
    super(ports);

    this.#sprite = this.addComponent(new SpriteComponent({
      imageId: "cursor_right.png",
      anchor: { x: 1.0, y: 0.5 },
      visible: false,
    }))!;
  }

  update(deltaTime: number) {
    super.update(deltaTime);

    if (!this.#enable) {
      return;
    }

    ++this.#blinkCounter;
    this.#sprite.visible = this.#blinkCounter % WindowCursor.settings.blinkRate < WindowCursor.settings.displayCount;
  }

  setEnable(enable: boolean) {
    if (this.#enable === enable) {
      return;
    }

    this.#enable = enable;
    this.#sprite.visible = enable;
    this.#resetAnimation(); // 表示→非表示/非表示→表示、どちらでも一旦リセット
  }

  setCursorMiddleRight(x: number, y: number) {
    this.setPosition(x, y);
    this.#resetAnimation();
  }

  #resetAnimation() {
    this.#blinkCounter = 0;
  }
}
