import { GameObject } from "@game/core";

export class GameRoot {
  #objects: GameObject[] = [];

  update(dt: number) {
    this.#objects.forEach(o => o.update(dt));
  }
}
