import { GameComponent, GameComponents } from "./game-component";
import { GamePorts } from "./game-ports";
import {
  ComponentById,
  ComponentTypeId,
  GroupGameObject,
  InputPort,
  RenderPort,
  Transform2D,
  TransformComponent
} from "..";

export class GameObject {
  #parent: GroupGameObject | null = null;
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

  get worldTransform(): Readonly<Transform2D> {
    const local = this.transform;

    if (!this.#parent) {
      return { ...local };
    }

    return {
      x: this.#parent.worldTransform.x + local.x,
      y: this.#parent.worldTransform.y + local.y,
      rotation: this.#parent.worldTransform.rotation + local.rotation,
      scaleX: this.#parent.worldTransform.scaleX * local.scaleX,
      scaleY: this.#parent.worldTransform.scaleY * local.scaleY,
    };
  }

  get worldX(): number {
    return (this.#parent?.worldX ?? 0) + this.transform.x;
  }

  get worldY(): number {
    return (this.#parent?.worldY ?? 0) + this.transform.y;
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

  get parent(): GroupGameObject | null {
    return this.#parent;
  }

  get #transform(): Readonly<TransformComponent> {
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

  // GroupGameObject からのみ使用する
  protected static setParentOf(child: GameObject, parent: GroupGameObject | null): void {
    child.#parent = parent;
  }

  protected onDisposeInternal(): void {}
}
