import { GameObject, SpriteComponent } from "@game/core";
import { RenderPort } from "@game/ports";

class Background extends GameObject {
  constructor(render: RenderPort, vw: number, vh: number) {
    super(render);
    const x = vw / 2;
    const y = vh / 2;
    this.setPosition(x, y);

    this.addComponent(new SpriteComponent("bg358x224.png"));
  }
}

class Smile extends GameObject {
  #rot: number = 0;
  #scale: number = 0;
  #sprite: SpriteComponent;

  constructor(render: RenderPort, vw: number, vh: number) {
    super(render);
    const x = vw / 2;
    const y = vh / 2;
    this.setPosition(x, y);

    this.#sprite = new SpriteComponent("smile.png");
    this.addComponent(this.#sprite);
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);

    this.#rot += 0.03;
    this.#scale += 0.03;

    this.setRotation(this.#rot);
    this.setScale(2.5 + 1.5 * Math.sin(this.#scale));
  }
}

export class GameRoot {
  #render: RenderPort;
  #objects: GameObject[] = [];

  public constructor(port: RenderPort) {
    this.#render = port;

    this.spawnGameObject(new Background(this.#render, 256, 224));
    this.spawnGameObject(new Smile(this.#render, 256, 224));
  }

  public spawnGameObject(gameObject: GameObject) {
    this.#objects.push(gameObject);
  }

  public update(deltaTime: number) {
    this.#objects.forEach(o => o.update(deltaTime));
  }
}
