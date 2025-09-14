import { TextComponent } from "@game/component/text-component";
import { GameObject, GamePorts, ScreenSizeAware} from "@game/core";

export class EnemySelectWindowText extends GameObject implements ScreenSizeAware {
  constructor(ports: GamePorts, _vw: number, _vh: number) {
    super(ports);

    this.addComponent(new TextComponent("かいはつちゅう　ー　１匹", { fontSize: 8 }));
  }

  onScreenSizeChanged(_vw: number, _vh: number) {
  }
}
