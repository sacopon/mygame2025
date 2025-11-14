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
      visible: true,
    };
  }

  update(gameObject: GameObject, _deltaTime: number): void {
    if (!this.#handle) {
      return;
    }

    gameObject.render.setTransform(
      this.#handle,
      {
        ...gameObject.worldTransform,
        ...{
          x: gameObject.worldTransform.x + (this.#spec.offset?.x ?? 0),
          y: gameObject.worldTransform.y + (this.#spec.offset?.y ?? 0),
        },
      });
    gameObject.render.setVisible(this.#handle, this.#spec.visible ?? true);
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

  override get visible() {
    return this.#spec.visible ?? false;
  }

  override set visible(value: boolean) {
    this.#spec.visible = value;
  }

  setAlpha(alpha: number): void {
    if (!this.#handle) {
      return;
    }

    this.owner.render.setAlpha(this.#handle, alpha);
  }
}

declare module "@game/presentation/component/component-registry" {
  interface ComponentRegistry {
    [RectComponent.typeId]: RectComponent;
  }
}
