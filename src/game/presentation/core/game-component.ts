import { GameObject } from "./game-object";
import { ComponentById, ComponentTypeId, TransformComponent } from "@game/presentation/component";

/**
 * GameComponent の共通インターフェース
 */
export interface GameComponent<T extends ComponentTypeId = ComponentTypeId> {
  readonly typeId: T;
  update?(gameObject: GameObject, deltaTime: number): void;
  onAttach?(gameObject: GameObject): void;
  onDetach?(gameObject: GameObject): void;
}

/**
 * GameComponent の共通部分
 */
export abstract class BaseGameComponent<T extends ComponentTypeId> implements GameComponent<T> {
  abstract readonly typeId: T;
  #owner: GameObject | null = null;

  protected onAttached?(gameObject: GameObject): void;
  protected onDetached?(gameObject: GameObject): void;

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
    this.onAttached?.(gameObject);
  }

  onDetach(gameObject: GameObject): void {
    if (!this.isAttached) {
      console.warn(`${this.constructor.name}: アタッチされてないのにデタッチされました`);
      return;
    }

    this.onDetached?.(gameObject);
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

  removeAllComponents(owner: GameObject): void {
    const list = this.#components.slice();

    for (const c of list) {
      // Transform コンポーネントは必須
      if (c instanceof TransformComponent) {
        continue;
      }

      this.#removeComponent(c, owner);
    }
  }

  #removeComponent(component: GameComponent, owner: GameObject): void {
    const id: ComponentTypeId = component.typeId;

    if (!this.#componentById.has(id)) {
      return;
    }

    // Transform コンポーネントは必須
    if (component instanceof TransformComponent) {
      return;
    }

    component.onDetach?.(owner);
    this.#componentById.delete(id);
    const index = this.#components.indexOf(component);

    if (0 <= index) {
      this.#components.splice(index, 1);
    }
  }

  getComponent<T extends ComponentTypeId>(id: T): ComponentById<T> | null {
    return (this.#componentById.get(id) as ComponentById<T> | undefined) ?? null;
  }
}

export interface ScreenSizeAware {
  onScreenSizeChanged(): void;
}

export function isScreenSizeAware(x: unknown): x is ScreenSizeAware {
  return typeof (x as { onScreenSizeChanged: unknown })?.onScreenSizeChanged === "function";
}
