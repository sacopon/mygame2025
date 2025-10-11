import { GameObject } from "../../../core/game-object";
import { ENEMY_SELECT_WINDOW_SETTINGS } from "./enemy-select-window-constants";
import { NineSliceSpriteComponent, RectComponent } from "@game/component";
import { GamePorts } from "@game/core";

/**
 * 敵選択ウィンドウの枠 + 背景表示
 */
export class EnemySelectWindowBase extends GameObject {
  constructor(ports: GamePorts, width: number, height: number) {
    super(ports);

    this.setPosition(0, 0); // 位置は EnemySelectWindowLayout が決める

    // ウィンドウ背景
    this.addComponent(new RectComponent({
      size: {
        width,
        height,
      },
      color: 0x000000,
      alpha: ENEMY_SELECT_WINDOW_SETTINGS.baseAlpha,
    }));

    // ウィンドウ枠
    this.addComponent(new NineSliceSpriteComponent({
      imageId: "window.png",
      border: { left: 8, top: 8, right: 8, bottom: 8 },
      size: { width, height },
    }))!;
  }
}
