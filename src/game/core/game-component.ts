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
 * GameComponent の共通部分
 */
export abstract class BaseGameComponent<T extends symbol> implements GameComponent<T> {
  abstract readonly typeId: T;
  #owner: GameObject | null = null;

  protected onAttached?(): void;
  protected onDetached?(): void;

  protected get isAttached(): boolean {
    return this.#owner !== null;
  }

  protected get owner(): GameObject {
    if (!this.#owner) {
      throw new Error(`${this.constructor.name}: owner is not attached yet`);
    }

    return this.#owner;
  }

  onAttach(gameObject: GameObject): void {
    if (this.isAttached) {
      console.warn(`${this.constructor.name}: 二重にアタッチされました`);
      return;
    }

    this.#owner = gameObject;
    this.onAttached?.();
  }

  onDetach(_gameObject: GameObject): void {
    if (!this.isAttached) {
      console.warn(`${this.constructor.name}: アタッチされてないのにでタッチされました`);
      return;
    }

    this.onDetached?.();
    this.#owner = null;
  }
}

/**
 * 複数の GameComponent を束ねるクラス
 */
export class GameComponents {
  #components: GameComponent[] = [];
  #componentById = new Map<ComponentTypeId, GameComponent>();

  update(deltaTime: number, gameObject: GameObject) {
    const list = this.#components.slice();

    for (const c of list) {
      c.update?.(gameObject, deltaTime);
    }
  }

  addComponent<I extends ComponentTypeId, T extends GameComponent<I>>(component: T): T | null {
    const id: ComponentTypeId = component.typeId;

    if (this.#componentById.has(id)) {
      return null;
    }

    this.#components.push(component);
    this.#componentById.set(id, component);

    return component;
  }

  getComponent<T extends ComponentTypeId>(id: T): ComponentById<T> | null {
    return (this.#componentById.get(id) as ComponentById<T> | undefined) ?? null;
  }
}

export interface ScreenSizeAware {
  onScreenSizeChanged(width: number, height: number): void;
}

export function isScreenSizeAware(x: unknown): x is ScreenSizeAware {
  return typeof (x as { onScreenSizeChanged: unknown })?.onScreenSizeChanged === "function";
}
