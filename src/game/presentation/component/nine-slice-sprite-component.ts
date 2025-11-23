import { BaseGameComponent } from "@game/presentation/core/game-component";
import { NineSliceSpriteSpec, ViewHandle } from "@game/presentation/ports";
import { GameObject } from "@game/presentation";

export class NineSliceSpriteComponent extends BaseGameComponent<typeof NineSliceSpriteComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("NineSliceSpriteComponent");
  readonly typeId: typeof NineSliceSpriteComponent.typeId = NineSliceSpriteComponent.typeId;

  #handle: ViewHandle | null = null;
  #spec: NineSliceSpriteSpec;

  constructor(spec: Partial<NineSliceSpriteSpec> & Required<Pick<NineSliceSpriteSpec, "imageId" | "border" | "size">>) {
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

  override get visible(): boolean {
    return this.#spec.visible ?? false;
  }

  override set visible(value: boolean) {
    this.#spec.visible = value;
  }

  protected override onAttached(): void {
    this.#handle = this.owner.render.createNineSliceSprite(this.#spec);
  }

  protected override onDetached(): void {
    if (!this.#handle) {
      return;
    }

    this.owner.render.destroyView(this.#handle);
    this.#handle = null;
  }

  setSize(width: number, height: number): void {
    this.owner!.render.setNineSpriteSize(this.#handle!, { width, height });
  }

  bringToTop(): void {
    if (!this.#handle) {
      return;
    }

    this.owner.render.bringToTop(this.#handle);
  }
}

declare module "@game/presentation/component/component-registry" {
  interface ComponentRegistry {
    [NineSliceSpriteComponent.typeId]: NineSliceSpriteComponent;
  }
}
