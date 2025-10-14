import { GameObject } from "../../../../presentation/core/game-object";
import { NineSliceSpriteComponent, RectComponent } from "@game/component";
import { GamePorts } from "@game/presentation";

/**
 * コマンド選択ウィンドウの枠 + 背景表示
 */
export class WindowBase extends GameObject {
  constructor(ports: GamePorts, width: number, height: number, alpha: number) {
    super(ports);

    // ウィンドウ背景
    this.addComponent(new RectComponent({
      size: {
        width:  width  - 4, // 左右それぞれ枠の半分の大きさ分だけ小さくする(枠の角に至らないようにする)
        height: height - 4, // 上下それぞれ枠の半分の大きさ分だけ小さくする(枠の角に至らないようにする)
      },
      offset: {
        x: 2, // 左右それぞれ枠の半分の大きさ分だけずらす
        y: 2, // 上下それぞれ枠の半分の大きさ分だけずらす
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
