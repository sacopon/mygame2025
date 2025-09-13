import { GameComponent, GameObject } from "@game/core";
import { ViewHandle } from "@game/ports";

export type SpriteSpec = {
  imageId: string;
  layer: number;
};

export class SpriteComponent implements GameComponent<typeof SpriteComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("SpriteComponent");
  readonly typeId: typeof SpriteComponent.typeId = SpriteComponent.typeId;

  #handle: ViewHandle | null = null;
  #spec: SpriteSpec;

  public constructor(imageId: string, layer = 0) {
    this.#spec = { imageId, layer };
  }

  public update(gameObject: GameObject, _deltaTime: number): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.setSpriteTransform(this.#handle, gameObject.transform);
  }

  public onAttach(gameObject: GameObject): void {
    this.#handle = gameObject.render.createSprite({
      imageId: this.#spec.imageId,
      layer: this.#spec.layer,
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

declare module "@game/component/component-registry" {
  interface ComponentRegistry {
    [SpriteComponent.typeId]: SpriteComponent;
  }
}
