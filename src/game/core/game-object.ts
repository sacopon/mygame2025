import { GameComponents, GameComponent, GamePorts, TransformComponent, ComponentTypeId, ComponentById } from "@game/core";
import { InputPort, RenderPort, Transform2D } from "@game/ports";

export class GameObject {
  #ports: GamePorts;
  #components: GameComponents;

  public constructor(ports: GamePorts) {
    this.#ports = ports;
    this.#components = new GameComponents();
    this.addComponent(new TransformComponent());
  }

  public get render(): Readonly<RenderPort> {
    return this.#ports.render;
  }

  public get input(): Readonly<InputPort> {
    return this.#ports.input;
  }

  public get transform(): Readonly<Transform2D> {
    return this.#components.getComponent(TransformComponent.typeId)!.transform;
  }

  public setPosition(x: number, y: number) {
    this.#transform.patch({ x, y });
  }

  public setRotation(rotation: number) {
    this.#transform.patch({ rotation });
  }

  public setScale(scale: number) {
    this.#transform.patch({ scaleX: scale, scaleY: scale });
  }

  public update(deltaTime: number) {
    this.#components.update(deltaTime, this);
  }

  get #transform(): TransformComponent {
    return this.#components.getComponent(TransformComponent.typeId)!;
  }

  public addComponent<I extends ComponentTypeId, T extends GameComponent<I>>(component: T): T | null {
    // 既に同じものが追加されていたら処理しない
    if (!this.#components.addComponent(component)) {
      return null;
    }

    component.onAttach?.(this);
    return component;
  }

  public getComponent<T extends ComponentTypeId>(id: T): ComponentById<T> | null {
    return this.#components.getComponent(id);
  }
}
