import { isScreenSizeAware, ScreenSizeAware } from "./game-component";
import { GameObject } from "./game-object";
import { GamePorts } from "./game-ports";

export class GroupGameObject extends GameObject implements ScreenSizeAware {
  #children: GameObject[] = [];
  #visible: boolean = true;

  constructor(ports: GamePorts) {
    super(ports);
  }

  addChild<T extends GameObject>(child: T): T {
    if (Object.is(child, this)) {
      throw new Error("Group cannot add itself as a child");
    }

    if (!child.isAlive) {
      throw new Error("Cannot add destroyed child");
    }

    if (this.#children.includes(child)) {
      return child;
    }

    child.visible = this.#visible;
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
    if (!child.isAlive) {
      return false;
    }

    const ok = this.removeChild(child);

    if (ok) {
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
    const children = this.#children.slice();

    for (let i = children.length - 1; i >= 0; --i) {
      try {
        children[i].onDispose();
      }
      catch (e) {
        // エラーが発生しても他のオブジェクトの破棄を最後まで実行するためキャッチする
        console.warn("GroupGameObject#onDispose(): onDispose failed for child", children[i], e);
      }
    }

    // ツリーから削除
    this.removeAllChildren();

    super.onDispose();
  }

  override set visible(value: boolean) {
    this.#visible = value;
    this.#children.forEach(child => { child.visible = value; });
  }

  /**
   * ゲーム画面のサイズ変化時
   *
   * @param width  新しい幅
   * @param height 新しい高さ
   */
  onScreenSizeChanged() {
    for (const go of this.#children) {
      if (!go.isAlive) {
        continue;
      }

      if (!isScreenSizeAware(go)) {
        continue;
      }

      go.onScreenSizeChanged();
    }
  }
}
