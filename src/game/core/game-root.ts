import { GameObject } from "@game/core";
import { RenderPort } from "@game/ports";

export class GameRoot {
  #render: RenderPort;
  #objects: GameObject[] = [];

  public constructor(port: RenderPort) {
    this.#render = port;
  }

  update(dt: number) {
    this.#objects.forEach(o => o.update(dt));
  }
}
