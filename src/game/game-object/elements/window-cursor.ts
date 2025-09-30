import { SpriteComponent } from "@game/component";
import { GameObject, GamePorts } from "@game/core";

export class WindowCursor extends GameObject {
  #counter: number = 0;
  #sprite: SpriteComponent;

  constructor(ports: GamePorts) {
    super(ports);

    this.#sprite = this.addComponent(new SpriteComponent({
      imageId: "cursor_right.png",
      anchor: { x: 1.0, y: 0.5 },
    }))!;
  }

  public update(deltaTime: number) {
    super.update(deltaTime);

    ++this.#counter;
    this.#sprite.visible = 10 < (this.#counter % 40);
  }

  setCursorMiddleRight(x: number, y: number) {
    this.setPosition(x, y);
  }
}
