import { SpriteSpec, ViewHandle } from "@game/presentation/ports";
import { BaseGameComponent, GameObject } from "@game/presentation";

export class SpriteComponent extends BaseGameComponent<typeof SpriteComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("SpriteComponent");
  readonly typeId: typeof SpriteComponent.typeId = SpriteComponent.typeId;

  #handle: ViewHandle | null = null;
  #spec: SpriteSpec;
  #visible: boolean;

  constructor(spec: Partial<SpriteSpec> & Required<Pick<SpriteSpec, "imageId">>) {
    super();
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

  protected override onAttached(): void {
    this.#handle = this.owner.render.createSprite(this.#spec);
  }

  protected override onDetached(): void {
    if (!this.#handle) {
      return;
    }

    this.owner.render.destroyView(this.#handle);
    this.#handle = null;
  }
}

declare module "@game/presentation/component/component-registry" {
  interface ComponentRegistry {
    [SpriteComponent.typeId]: SpriteComponent;
  }
}
