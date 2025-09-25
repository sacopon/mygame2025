import { NineSliceSpriteComponent, RectComponent } from "@game/component";
import { GameObject, GamePorts } from "@game/core";
import { ENEMY_SELECT_WINDOW_SETTINGS } from "@game/game-object/enemy-select-window";

export class EnemySelectWindowBase extends GameObject {
  #panel: NineSliceSpriteComponent;
  #windowSize = {
    width: 168,
    height: ENEMY_SELECT_WINDOW_SETTINGS.borderHeight + ENEMY_SELECT_WINDOW_SETTINGS.marginTop + (ENEMY_SELECT_WINDOW_SETTINGS.fontSize + ENEMY_SELECT_WINDOW_SETTINGS.lineMargin) * ENEMY_SELECT_WINDOW_SETTINGS.maxLines - ENEMY_SELECT_WINDOW_SETTINGS.lineMargin + ENEMY_SELECT_WINDOW_SETTINGS.marginBottom + ENEMY_SELECT_WINDOW_SETTINGS.borderHeight,
  };

  constructor(ports: GamePorts) {
    super(ports);

    this.setPosition(0, 0); // 位置は EnemySelectWindowLayout が決める

    // ウィンドウ背景
    this.addComponent(new RectComponent({
      size: {
        width: this.#windowSize.width,
        height: this.#windowSize.height,
      },
      color: 0x000000,
      alpha: 0.75, // 濃いめ
    }));

    // ウィンドウ枠
    this.#panel = this.addComponent(new NineSliceSpriteComponent({
      imageId: "window.png",
      border: { left: 8, top: 8, right: 8, bottom: 8 },
      size: { width: this.#windowSize.width, height: this.#windowSize.height },
    }))!;
  }

  getWidth(): number {
    return this.#windowSize.width;
  }

  getHeight(): number {
    return this.#windowSize.height;
  }
}
