import { GameComponent } from "@game/core";
import { RenderPort } from "@game/ports";
import { TransformComponent } from "./transform-component";

export class GameObject {
  #render: RenderPort | null = null;
  #components: GameComponent[] = [];
  #transform: TransformComponent;
  #attached: boolean = false;

  public constructor() {
    this.#transform = new TransformComponent();
    this.addComponent(this.#transform);
  }

  public update(deltaTime: number) {
    this.#components.forEach(c => c.update?.(this.#render!, deltaTime));
  }

  public addComponent(component: GameComponent) {
    this.#components.push(component);

    if (this.#render) {
      component.onAttach?.(this, this.#render);
    }
  }

  // GameRoot からのみ呼び出される内部処理
  static readonly __internal = {
    bindRender(gameObject: GameObject, render: RenderPort) {
      gameObject.bindRender(render);
    },

    unbindRender(gameObject: GameObject) {
      gameObject.#render = null;
    },
  }

  private bindRender(render: RenderPort) {
    if (render === this.#render && this.#attached) {
      return;
    }

    // 既にバインドされているなら一旦デタッチする
    if (this.#render && this.#attached) {
      this.#components.forEach(c => c.onDetach?.(this.#render!));
      this.#attached = false;
    }

    // 全てのコンポーネントに再アタッチ
    this.#render = render;
    this.#components.forEach(c => c.onAttach?.(this, this.#render!));
    this.#attached = true;
  }
}
