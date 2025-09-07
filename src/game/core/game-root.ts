import { GameObject, GamePorts, isScreenSizeAware, ScreenSizeAware, SpriteComponent } from "@game/core";
import { GameButton } from "@game/ports";

class Background extends GameObject implements ScreenSizeAware {
  constructor(ports: GamePorts, vw: number, vh: number) {
    super(ports);

    const x = vw / 2;
    const y = vh / 2;
    this.setPosition(x, y);
    this.addComponent(new SpriteComponent("bg358x224.png"));
  }

  onScreenSizeChanged(width: number, height: number) {
    this.setPosition(width / 2, height / 2);
  }
}

class Smile extends GameObject implements ScreenSizeAware {
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
    this.addComponent(new SpriteComponent("smile.png"));
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);

    this.#rot += 0.03;
    this.#scale += this.input.isDown(GameButton.A) ? 0.03 : 0.0;
    this.#scale -= this.input.isDown(GameButton.B) ? 0.03 : 0.0;
    this.#positionX += this.input.axisX() * 5;
    this.#positionY += this.input.axisY() * 5;

    this.setPosition(this.#positionX, this.#positionY);
    this.setRotation(this.#rot);
    this.setScale(this.#scale);
  }

  onScreenSizeChanged(width: number, height: number) {
    this.setPosition(width / 2, height / 2);
  }
}

export class GameRoot {
  #objects: GameObject[] = [];
  #unsubscribeScreen?: () => void;

  public constructor(ports: GamePorts) {
    const { screen } = ports;
    const { width, height } = screen.getGameSize();

    // 画面サイズ変更を購読
    this.#unsubscribeScreen = screen.onGameSizeChanged(size => {
      this.onScreenSizeChanged(size.width, size.height);
    });

    this.spawnGameObject(new Background(ports, width, height));
    this.spawnGameObject(new Smile(ports, width, height));

    this.onScreenSizeChanged(width, height);
  }

  public spawnGameObject<T extends GameObject>(gameObject: T): T {
    this.#objects.push(gameObject);
    return gameObject;
  }

  public update(deltaTime: number) {
    this.#objects.forEach(o => o.update(deltaTime));
  }

  public dispose() {
    this.#unsubscribeScreen?.();
    this.#unsubscribeScreen = undefined;
  }

  /**
   * ゲーム画面のサイズ変化時
   *
   * @param width  新しい幅
   * @param height 新しい高さ
   */
  public onScreenSizeChanged(width: number, height: number) {
    for (const go of this.#objects) {
      if (!isScreenSizeAware(go)) {
        continue;
      }

      go.onScreenSizeChanged(width, height);
    }
  }
}
