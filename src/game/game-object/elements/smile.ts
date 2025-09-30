import { SpriteComponent } from "@game/component";
import { GameObject, GamePorts, ScreenSizeAware } from "@game/core";
import { GameButton } from "@game/ports";

export class Smile extends GameObject implements ScreenSizeAware {
  #rot: number = 0;
  #scale: number = 1.0;
  #positionX: number = 0;
  #positionY: number = 0;

  constructor(ports: GamePorts, vw: number, vh: number) {
    super(ports);

    const x = vw / 2;
    const y = vh / 2;
    this.#positionX = x;
    this.#positionY = y;
    this.setPosition(x, y);
    this.addComponent(new SpriteComponent({
      imageId: "smile.png",
      anchor: { x: 0.5, y: 0.5 },
    }));
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);

    this.#rot += 0.03;
    this.#scale += this.input.isDown(GameButton.A) ? 0.03 : 0.0;
    this.#scale -= this.input.isDown(GameButton.B) ? 0.03 : 0.0;
    // this.#positionX += this.input.axisX() * 5;
    // this.#positionY += this.input.axisY() * 5;

    this.setPosition(this.#positionX, this.#positionY);
    this.setRotation(this.#rot);
    this.setScale(this.#scale);
  }

  onScreenSizeChanged(width: number, height: number) {
    this.setPosition(width / 2, height / 2);
  }
}
