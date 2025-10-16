import { GameScreenSpec, VIRTUAL_SCREEN_CHANGE } from "@app/services";
import { ScreenPort, GameSize } from "@game/presentation/ports";

export class ScreenPortAdapter implements ScreenPort {
  #spec: GameScreenSpec;

  constructor(spec: GameScreenSpec) {
    this.#spec = spec;
  }

  getGameSize(): GameSize {
    const c = this.#spec.current;
    return { width: c.width, height: c.height };
  }

  onGameSizeChanged(handler: (size: GameSize) => void): () => void {
    const listener = (ev: Event) => {
      const { width, height } = (ev as CustomEvent<GameSize>).detail;
      handler({ width, height });
    };

    this.#spec.addEventListener(VIRTUAL_SCREEN_CHANGE, listener);
    return () => this.#spec.removeEventListener(VIRTUAL_SCREEN_CHANGE, listener);
  }
}
