import { GameObject, isScreenSizeAware, ScreenSizeAware, SpriteComponent } from "@game/core";
import { RenderPort } from "@game/ports";

class Background extends GameObject implements ScreenSizeAware {
  constructor(render: RenderPort, vw: number, vh: number) {
    super(render);

    console.log(`vw: ${vw}, vh:${vh}`);
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
  #scale: number = 0;

  constructor(render: RenderPort, vw: number, vh: number) {
    super(render);

    const x = vw / 2;
    const y = vh / 2;
    this.setPosition(x, y);
    this.addComponent(new SpriteComponent("smile.png"));
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);

    this.#rot += 0.03;
    this.#scale += 0.03;

    this.setRotation(this.#rot);
    this.setScale(2.5 + 1.5 * Math.sin(this.#scale));
  }

  onScreenSizeChanged(width: number, height: number) {
    this.setPosition(width / 2, height / 2);
  }
}

export class GameRoot {
  #objects: GameObject[] = [];

  public constructor(render: RenderPort) {
    this.spawnGameObject(new Background(render, 0, 0));
    this.spawnGameObject(new Smile(render, 0, 0));
  }

  public spawnGameObject<T extends GameObject>(gameObject: T): T {
    this.#objects.push(gameObject);
    return gameObject;
  }

  public update(deltaTime: number) {
    this.#objects.forEach(o => o.update(deltaTime));
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
