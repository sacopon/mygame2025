import { GameObject } from "../../../../core/game-object";
import { NineSliceSpriteComponent, RectComponent } from "@game/component";
import { GamePorts } from "@game/core";

/**
 * コマンド選択ウィンドウの枠 + 背景表示
 */
export class WindowBase extends GameObject {
  constructor(ports: GamePorts, width: number, height: number, alpha: number) {
    super(ports);

    this.setPosition(0, 0); // 位置は EnemySelectWindowLayout が決める

    // ウィンドウ背景
    this.addComponent(new RectComponent({
      size: {
        width,
        height,
      },
      color: 0x000000,
      alpha,
    }));

    // ウィンドウ枠
    this.addComponent(new NineSliceSpriteComponent({
      imageId: "window.png",
      border: { left: 8, top: 8, right: 8, bottom: 8 },
      size: { width, height },
    }))!;
  }
}
