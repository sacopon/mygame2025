import { GroupGameObject } from "@game/presentation/core/group-game-object";
import { ListWindowContents } from "./list-window-contents";
import { WindowBase } from "./window-base";
import { wrapIndex } from "@shared/utils";
import { GamePorts } from "@game/presentation";

/**
 * 選択系ウィンドウ共通部分
 * 選択肢の切り替えの責務を持つ
 */
export abstract class ListSelectWindow<T> extends GroupGameObject {
  #contents: ListWindowContents;
  #selectedIndex = 0;

  constructor(ports: GamePorts, size: { width: number, height: number }, alpha: number, createContents: (ports: GamePorts) => ListWindowContents) {
    super(ports);

    this.addChild(new WindowBase(ports, size.width, size.height, alpha));
    this.#contents = this.addChild(createContents(ports));
  }

  setActive(active: boolean): void {
    this.#contents.setCursorVisible(active);
    // TODO: 非アクティブ時は薄暗くする？
  }

  select(index: number, force: boolean = false) {
    const n = this.selectionCount;

    if (n === 0) {
      return;
    }

    if (!force && index === this.#selectedIndex) {
      return;
    }

    this.#selectedIndex = wrapIndex(index, n);
    this.#contents.setCursorIndex(this.#selectedIndex);
  }

  selectNext(): void {
    if (this.selectionCount === 0) {
      return;
    }

    this.select(this.#selectedIndex + 1);
  }

  selectPrev(): void {
    if (this.selectionCount === 0) {
      return;
    }

    this.select(this.#selectedIndex - 1);
  }

  reset(): void {
    this.select(0, true);
  }

  get selectedIndex(): number {
    return this.#selectedIndex;
  }

  get contents(): ListWindowContents {
    return this.#contents;
  }

  abstract getCurrent(): T;
  abstract get width(): number;
  abstract get height(): number;
  abstract get selectionCount(): number;
}
