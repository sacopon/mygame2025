import { GameObject } from "./game-object";
import { GamePorts } from "./game-ports";

export class GroupGameObject extends GameObject {
  #children: GameObject[] = [];

  constructor(ports: GamePorts) {
    super(ports);
  }

  addChild<T extends GameObject>(child: T): T {
    this.#children.push(child);
    return child;
  }

  removeChild<T extends GameObject>(child: T): void {
    const index = this.#children.indexOf(child);

    if (index < 0) {
      return;
    }

    this.#children.splice(index, 1);
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    for (const c of this.#children) {
      c.update(deltaTime);
    }
  }
}
