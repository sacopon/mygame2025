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

  override setPosition(x: number, y: number): void {
    const prevX = this.transform.x;
    const prevY = this.transform.y;
    super.setPosition(x, y);

    const dx = this.transform.x - prevX;
    const dy = this.transform.y - prevY;

    if (dx === 0 && dy === 0) {
      return;
    }

    for (const c of this.#children) {
      c.setPosition(c.transform.x + dx, c.transform.y + dy);
    }
  }
}
