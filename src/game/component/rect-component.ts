import { GameComponent, GameObject } from "@game/core";
import { RectSpec, ViewHandle } from "@game/ports";

export class RectComponent implements GameComponent<typeof RectComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("RectComponent");
  readonly typeId: typeof RectComponent.typeId = RectComponent.typeId;

  #handle: ViewHandle | null = null;
  #spec: RectSpec;

  constructor(spec: { size: { width: number, height: number }, color?: number, alpha?: number}) {
    this.#spec = {
      ...spec,
    };
  }

  update(gameObject: GameObject, _deltaTime: number): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.setSpriteTransform(this.#handle, gameObject.transform);
  }

  onAttach(gameObject: GameObject): void {
    this.#handle = gameObject.render.createRect(this.#spec);
  }

  onDetach(gameObject: GameObject): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.destroyView(this.#handle);
    this.#handle = null;
  }
}

declare module "@game/component/component-registry" {
  interface ComponentRegistry {
    [RectComponent.typeId]: RectComponent;
  }
}
