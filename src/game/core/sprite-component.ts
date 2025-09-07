import { GameComponent, GameObject } from "@game/core";
import { RenderPort, SpriteHandle, Transform2D } from "@game/ports";

export class SpriteComponent implements GameComponent {
  #handle: SpriteHandle | null = null;
  #imageId: string;
  #transform: Partial<Transform2D>;
  #layer: number;

  public constructor(imageId: string, transform: Partial<Transform2D>, layer = 0) {
    this.#imageId = imageId;
    this.#transform = transform;
    this.#layer = layer;
  }

  public update(render: RenderPort, deltaTime: number): void {
    if (!this.#handle) {
      return;
    }

    render.setSpriteTransform(this.#handle, this.#transform);
  }

  public onAttach(gameObject: GameObject, render: RenderPort): void {
    this.#handle = render.createSprite({
      imageId: this.#imageId,
      transform: this.#transform,
      layer: this.#layer,
    });
  }

  public onDetach(render: RenderPort): void {
    if (!this.#handle) {
      return;
    }

    render.destroyView(this.#handle);
    this.#handle = null;
  }
}
