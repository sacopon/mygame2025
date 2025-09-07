import { GameComponent, GameObject } from "@game/core";
import { identityTransform, Transform2D } from "@game/ports";

export class TransformComponent implements GameComponent {
  #transform: Transform2D = { ...identityTransform };

  public constructor() {
  }

  public get transform(): Readonly<Transform2D> {
    return this.#transform;
  }

  public set transform(t: Partial<Transform2D>) {
    this.#transform = {...this.#transform, ...t};
  }

  update?(gameObject: GameObject, deltaTime: number): void;
}
