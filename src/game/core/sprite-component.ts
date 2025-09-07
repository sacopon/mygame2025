import { GameComponent, GameObject } from "@game/core";
import { SpriteHandle } from "@game/ports";

export class SpriteComponent implements GameComponent {
  #handle: SpriteHandle | null = null;
  #imageId: string;
  #layer: number;

  public constructor(imageId: string, layer = 0) {
    this.#imageId = imageId;
    this.#layer = layer;
  }

  public update(gameObject: GameObject, _deltaTime: number): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.setSpriteTransform(this.#handle, gameObject.transform);
  }

  public onAttach(gameObject: GameObject): void {
    this.#handle = gameObject.render.createSprite({
      imageId: this.#imageId,
      layer: this.#layer,
    });
  }

  public onDetach(gameObject: GameObject): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.destroyView(this.#handle);
    this.#handle = null;
  }
}
