import { GameComponents, GameComponent, GamePorts, TransformComponent } from "@game/core";
import { Ctor } from "@shared";
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
    return this.#components.getComponent(TransformComponent)!.transform;
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
    return this.#components.getComponent(TransformComponent)!;
  }

  public addComponent<T extends GameComponent>(component: T): T | null {
    // 既に同じものが追加されていたら処理しない
    if (!this.#components.addComponent(component)) {
      return null;
    }

    component.onAttach?.(this);
    return component;
  }

  public getComponent<T extends GameComponent>(ctor: Ctor<T>): T | null {
    return this.#components.getComponent(ctor);
  }
}
