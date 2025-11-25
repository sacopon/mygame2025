import { GameObject } from "../../../../core/game-object";
import { WindowBase } from "./window-base";
import { RectComponent } from "@game/presentation/component";
import { GamePorts } from "@game/presentation";

/**
 * ウィンドウを覆う矩形
 */
export class WindowCoverRect extends GameObject {
  constructor(ports: GamePorts, base: WindowBase, color: number) {
    super(ports);

    this.addComponent(new RectComponent({
      size: {
        width:  base.width,
        height: base.height,
      },
      color,
    }));
  }

  setAlpha(alpha: number): void {
    this.getComponent(RectComponent.typeId)!.setAlpha(alpha);
  }

  override bringToTop(): void {
    super.bringToTop();
    this.getComponent(RectComponent.typeId)!.bringToTop();
  }
}
