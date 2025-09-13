import { GameComponent, GameObject } from "@game/core";
import { identityTransform, Transform2D } from "@game/ports";

export class TransformComponent implements GameComponent<typeof TransformComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("TransformComponent");
  readonly typeId: typeof TransformComponent.typeId = TransformComponent.typeId;

  #transform: Transform2D = { ...identityTransform };

  public constructor() {
  }

  public get transform(): Readonly<Transform2D> {
    return this.#transform;
  }

  public patch(t: Partial<Transform2D>) {
    this.#transform = {...this.#transform, ...t};
  }

  update?(gameObject: GameObject, deltaTime: number): void;
}

declare module "@game/core/component-registry" {
  interface ComponentRegistry {
    [TransformComponent.typeId]: TransformComponent;
  }
}
