import { GameObject } from "@game/core";

export interface GameComponent {
  update?(gameObject: GameObject, deltaTime: number): void;
  onAttach?(gameObject: GameObject): void;
  onDetach?(gameObject: GameObject): void;
}
