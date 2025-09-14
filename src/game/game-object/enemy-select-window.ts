import { NineSliceSpriteComponent } from "@game/component";
import { TextComponent } from "@game/component/text-component";
import { GameObject, GamePorts, ScreenSizeAware} from "@game/core";

export class EnemySelectWindow extends GameObject implements ScreenSizeAware {
  #panel: NineSliceSpriteComponent;

  constructor(ports: GamePorts, _vw: number, _vh: number) {
    super(ports);

    this.setPosition(100, 100);
    this.#panel = this.addComponent(new NineSliceSpriteComponent("window.png", { left: 8, top: 8, right: 8, bottom: 8 }, { width: 200, height: 100 }))!;

    this.context.gameObjectAccess.spawnGameObject(new Background(context.ports, width, height));
  }

  onScreenSizeChanged(_vw: number, _vh: number) {
  }
}
