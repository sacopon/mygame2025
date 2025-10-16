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

  constructor(ports: GamePorts) {
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

  get #transform(): TransformComponent {
    return this.#components.getComponent(TransformComponent.typeId)!;
  }

  addComponent<I extends ComponentTypeId, T extends GameComponent<I>>(component: T): T | null {
    // 既に同じものが追加されていたら処理しない
    if (!this.#components.addComponent(component)) {
      return null;
    }

    component.onAttach?.(this);
    return component;
  }

  getComponent<T extends ComponentTypeId>(id: T): ComponentById<T> | null {
    return this.#components.getComponent(id);
  }
}
