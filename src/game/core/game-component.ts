import { GameObject } from "@game/core";
import { RenderPort } from "@game/ports";

export interface GameComponent {
  update?(render: RenderPort, deltaTime: number): void;
  onAttach?(gameObject: GameObject, render: RenderPort): void;
  onDetach?(render: RenderPort): void;
}
