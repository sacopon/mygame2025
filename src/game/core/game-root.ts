import { GameObject, SpriteComponent } from "@game/core";
import { RenderPort } from "@game/ports";

class Background extends GameObject {
  constructor(vw: number, vh: number) {
    super();
    this.addComponent(new SpriteComponent("bg358x224.png", { x: vw / 2, y: vh / 2, }));
  }
}

export class GameRoot {
  #render: RenderPort;
  #objects: GameObject[] = [];

  public constructor(port: RenderPort) {
    this.#render = port;

    this.spawnGameObject(new Background(256, 224));
  }

  public spawnGameObject(gameObject: GameObject) {
    GameObject.__internal.bindRender(gameObject, this.#render);
    this.#objects.push(gameObject);
  }

  public update(deltaTime: number) {
    this.#objects.forEach(o => o.update(deltaTime));
  }
}
