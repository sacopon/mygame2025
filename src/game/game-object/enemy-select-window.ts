import { NineSliceSpriteComponent, RectComponent, TextListComponent } from "@game/component";
import { GameObject, GamePorts, ScreenSizeAware} from "@game/core";

export class EnemySelectWindow extends GameObject implements ScreenSizeAware {
  #panel: NineSliceSpriteComponent;
  #textList: TextListComponent;

  constructor(ports: GamePorts, _vw: number, _vh: number) {
    super(ports);

    const windowSpec = {
      x: 160 / 2,
      y: 148,
      width: 168,
      height: 68,
    };

    this.setPosition(windowSpec.x, windowSpec.y);

    // ウィンドウ背景
    this.addComponent(new RectComponent({
      size: {
        width: windowSpec.width,
        height: windowSpec.height,
      },
      color: 0x000000,
      alpha: 0.75, // 濃いめ
    }));

    // ウィンドウ枠
    this.#panel = this.addComponent(new NineSliceSpriteComponent({
      imageId: "window.png",
      border: { left: 8, top: 8, right: 8, bottom: 8 },
      size: { width: windowSpec.width, height: windowSpec.height },
    }))!;

    // 中身
    this.#textList = this.addComponent(new TextListComponent(
      ["キングスライム　─　1匹", "キングスライム　─　1匹"],
      { fontSize: 12, },
      {
        offsetX: 4 + 2 + 14,
        offsetY: 4 + 2,
        lineHeight: 16,
      }))!;
  }

  onScreenSizeChanged(_vw: number, _vh: number) {
  }
}
