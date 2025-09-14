import { NineSliceSpriteComponent, TextListComponent } from "@game/component";
import { GameObject, GamePorts, ScreenSizeAware} from "@game/core";

export class EnemySelectWindow extends GameObject implements ScreenSizeAware {
  #panel: NineSliceSpriteComponent;
  #textList: TextListComponent;

  constructor(ports: GamePorts, _vw: number, _vh: number) {
    super(ports);

    this.setPosition(160 / 2, 148);

    // ウィンドウ枠
    this.#panel = this.addComponent(new NineSliceSpriteComponent({
      imageId: "window.png",
      border: { left: 8, top: 8, right: 8, bottom: 8 },
      size: { width: 168, height: 68 },
    }))!;

    // ウィンドウ背景

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
