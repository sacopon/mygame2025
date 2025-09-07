import { GameObject } from "@game/core";

export interface GameComponent {
  update?(gameObject: GameObject, deltaTime: number): void;
  onAttach?(gameObject: GameObject): void;
  onDetach?(gameObject: GameObject): void;
}

export interface ScreenSizeAware {
  onScreenSizeChanged(width: number, height: number): void;
}

export function isScreenSizeAware(x: unknown): x is ScreenSizeAware {
  return typeof (x as { onScreenSizeChanged: unknown })?.onScreenSizeChanged === "function";
}
