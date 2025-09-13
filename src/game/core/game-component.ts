import { ComponentById, ComponentTypeId } from "@game/component";
import { GameObject } from "@game/core";

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
  #componentById = new Map<ComponentTypeId, GameComponent>();

  public update(deltaTime: number, gameObject: GameObject) {
    const list = this.#components.slice();

    for (const c of list) {
      c.update?.(gameObject, deltaTime);
    }
  }

  public addComponent<I extends ComponentTypeId, T extends GameComponent<I>>(component: T): T | null {
    const id: ComponentTypeId = component.typeId;

    if (this.#componentById.has(id)) {
      return null;
    }

    this.#components.push(component);
    this.#componentById.set(id, component);

    return component;
  }

  public getComponent<T extends ComponentTypeId>(id: T): ComponentById<T> | null {
    return (this.#componentById.get(id) as ComponentById<T> | undefined) ?? null;
  }
}

export interface ScreenSizeAware {
  onScreenSizeChanged(width: number, height: number): void;
}

export function isScreenSizeAware(x: unknown): x is ScreenSizeAware {
  return typeof (x as { onScreenSizeChanged: unknown })?.onScreenSizeChanged === "function";
}
