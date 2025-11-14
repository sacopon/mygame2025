import { SpriteSpec, ViewHandle } from "@game/presentation/ports";
import { BaseGameComponent, GameObject } from "@game/presentation";

export class SpriteComponent extends BaseGameComponent<typeof SpriteComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("SpriteComponent");
  readonly typeId: typeof SpriteComponent.typeId = SpriteComponent.typeId;

  #handle: ViewHandle | null = null;
  #spec: SpriteSpec;

  constructor(spec: Partial<SpriteSpec> & Required<Pick<SpriteSpec, "imageId">>) {
    super();
    this.#spec = { ...spec };
  }

  update(gameObject: GameObject, _deltaTime: number): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.setTransform(this.#handle, gameObject.worldTransform);
    gameObject.render.setVisible(this.#handle, this.#spec.visible ?? true);
  }

  override get visible() {
    return this.#spec.visible ?? false;
  }

  override set visible(value: boolean) {
    this.#spec.visible = value;
  }

  get width(): number {
    if (!this.#handle) {
      return 0;
    }

    return this.owner.render.getWidth(this.#handle);
  }

  get height(): number {
    if (!this.#handle) {
      return 0;
    }

    return this.owner.render.getHeight(this.#handle);
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
