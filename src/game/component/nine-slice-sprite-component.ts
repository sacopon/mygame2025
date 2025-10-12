import { GameComponent, GameObject } from "@game/core";
import { NineSliceSpriteSpec, ViewHandle } from "@game/ports";

export class NineSliceSpriteComponent implements GameComponent<typeof NineSliceSpriteComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("NineSliceSpriteComponent");
  readonly typeId: typeof NineSliceSpriteComponent.typeId = NineSliceSpriteComponent.typeId;

  #owner: GameObject | null = null;
  #handle: ViewHandle | null = null;
  #spec: NineSliceSpriteSpec;

  constructor(spec: Partial<NineSliceSpriteSpec> & Required<Pick<NineSliceSpriteSpec, "imageId" | "border" | "size">>) {
    this.#spec = { ...spec };
  }

  update(gameObject: GameObject, _deltaTime: number): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.setSpriteTransform(this.#handle, gameObject.transform);
  }

  onAttach(gameObject: GameObject): void {
    this.#owner = gameObject;
    this.#handle = gameObject.render.createNineSliceSprite(this.#spec);
  }

  onDetach(gameObject: GameObject): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.destroyView(this.#handle);
    this.#handle = null;
  }

  setSize(width: number, height: number): void {
    this.#owner!.render.setNineSpriteSize(this.#handle!, { width, height });
  }
}

declare module "@game/component/component-registry" {
  interface ComponentRegistry {
    [NineSliceSpriteComponent.typeId]: NineSliceSpriteComponent;
  }
}
