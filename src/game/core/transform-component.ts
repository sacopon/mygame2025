import { GameComponent } from "@game/core";
import { identityTransform, RenderPort, Transform2D } from "@game/ports";

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

  update?(render: RenderPort, deltaTime: number): void;
}
