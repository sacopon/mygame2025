import { GameComponent } from "@game/presentation/core/game-component";
import { identityTransform, Transform2D } from "@game/presentation/ports";
import { GameObject } from "@game/presentation";

export class TransformComponent implements GameComponent<typeof TransformComponent.typeId> {
  static readonly typeId: unique symbol = Symbol("TransformComponent");
  readonly typeId: typeof TransformComponent.typeId = TransformComponent.typeId;

  #transform: Transform2D = { ...identityTransform };

  constructor() {
  }

  get transform(): Readonly<Transform2D> {
    return this.#transform;
  }

  patch(t: Partial<Transform2D>) {
    this.#transform = {...this.#transform, ...t};
  }

  update?(gameObject: GameObject, deltaTime: number): void;
}

declare module "@game/presentation/component/component-registry" {
  interface ComponentRegistry {
    [TransformComponent.typeId]: TransformComponent;
  }
}
