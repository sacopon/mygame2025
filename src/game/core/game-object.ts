import { GameComponent, TransformComponent } from "@game/core";
import { Ctor } from "@shared";
import { RenderPort, Transform2D } from "@game/ports";

export class GameObject {
  #render: RenderPort;
  #components: GameComponent[] = [];
  #componentByType = new Map<Ctor<GameComponent>, GameComponent>();
  #transform: TransformComponent;

  public constructor(render: RenderPort) {
    this.#render = render;
    this.#transform = new TransformComponent();
    this.addComponent(this.#transform);
  }

  public get render(): Readonly<RenderPort> {
    return this.#render;
  }

  public get transform(): Readonly<Transform2D> {
    return this.#transform.transform;
  }

  public setPosition(x: number, y: number) {
    this.#transform.transform = { x, y };
  }

  public setRotation(rotation: number) {
    this.#transform.transform = { rotation };
  }

  public setScale(scale: number) {
    this.#transform.transform = { scaleX: scale, scaleY: scale };
  }

  public update(deltaTime: number) {
    this.#components.forEach(c => c.update?.(this, deltaTime));
  }

  public addComponent<T extends GameComponent>(component: T): T {
    this.#components.push(component);
    this.#componentByType.set(component.constructor as Ctor<GameComponent>, component);
    component.onAttach?.(this);

    return component;
  }

  public getComponent<T extends GameComponent>(ctor: Ctor<T>): T | undefined {
    return this.#componentByType.get(ctor) as T | undefined;
  }
}
