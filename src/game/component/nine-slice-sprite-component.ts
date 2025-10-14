import { BaseGameComponent } from "@game/presentation/core/game-component";
import { NineSliceSpriteSpec, ViewHandle } from "@game/ports";
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

    gameObject.render.setSpriteTransform(this.#handle, gameObject.transform);
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
}

declare module "@game/component/component-registry" {
  interface ComponentRegistry {
    [NineSliceSpriteComponent.typeId]: NineSliceSpriteComponent;
  }
}
