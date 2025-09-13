import { GameObject } from "@game/core";
import { Ctor } from "@shared";

/**
 * GameComponent の共通インターフェース
 */
export interface GameComponent<T extends symbol = symbol> {
  readonly typeId: T;
  update?(gameObject: GameObject, deltaTime: number): void;
  onAttach?(gameObject: GameObject): void;
  onDetach?(gameObject: GameObject): void;
}

/**
 * 複数の GameComponent を束ねるクラス
 */
export class GameComponents {
  #components: GameComponent[] = [];
  #componentByType = new Map<Ctor<GameComponent>, GameComponent>();

  public constructor() {
  }

  public update(deltaTime: number, gameObject: GameObject) {
    const list = this.#components.slice();

    for (const c of list) {
      c.update?.(gameObject, deltaTime);
    }
  }

  public addComponent<T extends GameComponent>(component: T): T | null {
    if (this.getComponent(component.constructor as Ctor<GameComponent>)) {
      return null;
    }

    this.#components.push(component);
    this.#componentByType.set(component.constructor as Ctor<GameComponent>, component);
    return component;
  }

  public getComponent<T extends GameComponent>(ctor: Ctor<T>): T | null {
    return this.#componentByType.get(ctor) as T | null;
  }
}

export interface ScreenSizeAware {
  onScreenSizeChanged(width: number, height: number): void;
}

export function isScreenSizeAware(x: unknown): x is ScreenSizeAware {
  return typeof (x as { onScreenSizeChanged: unknown })?.onScreenSizeChanged === "function";
}
