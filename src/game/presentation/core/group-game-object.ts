import { GameObject } from "./game-object";
import { GamePorts } from "./game-ports";

export class GroupGameObject extends GameObject {
  #children: GameObject[] = [];

  constructor(ports: GamePorts) {
    super(ports);
  }

  addChild<T extends GameObject>(child: T): T {
    if (this.#children.includes(child)) {
      return child;
    }

    this.#children.push(child);
    return child;
  }

  removeChild<T extends GameObject>(child: T): boolean {
    const index = this.#children.indexOf(child);

    if (index < 0) {
      return false;
    }

    this.#children.splice(index, 1);
    return true;
  }

  removeAllChildren(): void {
    this.#children.length = 0;
  }

  destroyChild<T extends GameObject>(child: T): boolean {
    const ok = this.removeChild(child);

    if (ok && child.isAlive) {
      child.destroy();
    }

    return ok;
  }

  destroyAllChildren(): void {
    for (const c of this.#children) {
      if (c.isAlive) {
        c.destroy();
      }
    }
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    const children = this.#children.slice();

    for (const c of children) {
      if (c.isAlive) {
        c.update(deltaTime);
      }
    }

    const alives = [];
    for (const o of children) {
      if (o.isAlive) {
        alives.push(o);
      }
      else {
        try {
          o.onDispose();
        }
        catch (e) {
          // あと片付け中はエラーが発生しても続行
          console.warn("GroupGameObject#update(): onDispose is failed for", o, e);
        }
      }
    }

    this.#children = alives;
  }

  override setPosition(x: number, y: number): void {
    const prevX = this.transform.x;
    const prevY = this.transform.y;
    super.setPosition(x, y);

    const dx = this.transform.x - prevX;
    const dy = this.transform.y - prevY;

    if (dx === 0 && dy === 0) {
      return;
    }

    for (const c of this.#children) {
      if (c.isAlive) {
        c.setPosition(c.transform.x + dx, c.transform.y + dy);
      }
    }
  }

  override onDispose(): void {
    // 先に破棄の予約をする
    this.destroyAllChildren();

    // 実際に破棄する
    for (let i = this.#children.length - 1; i >= 0; --i) {
      try {
        this.#children[i].onDispose();
      }
      catch (e) {
        // エラーが発生しても他のオブジェクトの破棄を最後まで実行するためキャッチする
        console.warn("GroupGameObject#onDispose(): onDispose failed for child", this.#children[i], e);
      }
    }

    // ツリーから削除
    this.removeAllChildren();

    super.onDispose();
  }
}
