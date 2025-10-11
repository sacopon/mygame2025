import { GameComponent, GameObject } from "@game/core";
import { SpriteSpec, ViewHandle } from "@game/ports";

export class SpriteComponent implements GameComponent<typeof SpriteComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("SpriteComponent");
  readonly typeId: typeof SpriteComponent.typeId = SpriteComponent.typeId;

  #handle: ViewHandle | null = null;
  #spec: SpriteSpec;
  #visible: boolean;

  public constructor(spec: Partial<SpriteSpec> & Required<Pick<SpriteSpec, "imageId">>) {
    this.#spec = { ...spec };
    this.#visible = this.#spec.visible ?? true;
  }

  update(gameObject: GameObject, _deltaTime: number): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.setSpriteTransform(this.#handle, gameObject.transform);
    gameObject.render.setSpriteVisible(this.#handle, this.#visible);
  }

  get visible() {
    return this.#visible;
  }

  set visible(value: boolean) {
    this.#visible = value;
  }

  onAttach(gameObject: GameObject): void {
    this.#handle = gameObject.render.createSprite(this.#spec);
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
    [SpriteComponent.typeId]: SpriteComponent;
  }
}
