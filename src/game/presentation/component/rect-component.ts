import { RectSpec, ViewHandle } from "@game/presentation/ports";
import { BaseGameComponent, GameObject } from "@game/presentation";

export class RectComponent extends BaseGameComponent<typeof RectComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("RectComponent");
  readonly typeId: typeof RectComponent.typeId = RectComponent.typeId;

  #handle: ViewHandle | null = null;
  #spec: RectSpec;

  constructor(spec: { size: { width: number, height: number }, color?: number, alpha?: number, offset?: { x?: number, y?: number }}) {
    super();
    this.#spec = {
      ...spec,
    };
  }

  update(gameObject: GameObject, _deltaTime: number): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.setSpriteTransform(
      this.#handle,
      {
        ...gameObject.transform,
        ...{
          x: gameObject.transform.x + (this.#spec.offset?.x ?? 0),
          y: gameObject.transform.y + (this.#spec.offset?.y ?? 0),
        },
      });
  }

  override onAttached(gameObject: GameObject): void {
    this.#handle = gameObject.render.createRect(this.#spec);
  }

  override onDetached(gameObject: GameObject): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.destroyView(this.#handle);
    this.#handle = null;
  }
}

declare module "@game/presentation/component/component-registry" {
  interface ComponentRegistry {
    [RectComponent.typeId]: RectComponent;
  }
}
