import { GameComponent, GameComponents } from "./game-component";
import { GamePorts } from "./game-ports";
import {
  ComponentById,
  ComponentTypeId,
  InputPort,
  RenderPort,
  Transform2D,
  TransformComponent
} from "..";

export class GameObject {
  #ports: GamePorts;
  #components: GameComponents;
  #alive: boolean;
  #disposed: boolean;
  #visible: boolean;

  constructor(ports: GamePorts) {
    this.#alive = true;
    this.#disposed = false;
    this.#visible = true;
    this.#ports = ports;
    this.#components = new GameComponents();
    this.addComponent(new TransformComponent());
  }

  get ports(): Readonly<GamePorts> {
    return this.#ports;
  }

  get render(): Readonly<RenderPort> {
    return this.#ports.render;
  }

  get input(): Readonly<InputPort> {
    return this.#ports.input;
  }

  get transform(): Readonly<Transform2D> {
    return this.#components.getComponent(TransformComponent.typeId)!.transform;
  }

  get isAlive(): boolean {
    return this.#alive;
  }

  setPosition(x: number, y: number) {
    this.#transform.patch({ x, y });
  }

  setRotation(rotation: number) {
    this.#transform.patch({ rotation });
  }

  setScale(scale: number) {
    this.#transform.patch({ scaleX: scale, scaleY: scale });
  }

  update(deltaTime: number) {
    this.#components.update(deltaTime, this);
  }

  destroy(): void {
    this.#alive = false;
  }

  onDispose(): void {
    if (this.#disposed) {
      return;
    }

    this.#disposed = true;
    this.#components.removeAllComponents(this);
    this.onDisposeInternal();
  }

  get x(): number {
    return this.transform.x;
  }

  get y(): number {
    return this.transform.y;
  }

  get visible(): boolean {
    return this.#visible;
  }

  set visible(value: boolean) {
    this.#visible = value;
    this.#components.visible = value;
  }

  get #transform(): TransformComponent {
    return this.#components.getComponent(TransformComponent.typeId)!;
  }

  addComponent<I extends ComponentTypeId, T extends GameComponent<I>>(component: T): T | null {
    // 既に同じものが追加されていたら処理しない
    if (!this.#components.addComponent(component)) {
      return null;
    }

    component.onAttach?.(this);
    component.visible = this.#visible;
    return component;
  }

  getComponent<T extends ComponentTypeId>(id: T): ComponentById<T> | null {
    return this.#components.getComponent(id);
  }

  protected onDisposeInternal(): void {}
}
