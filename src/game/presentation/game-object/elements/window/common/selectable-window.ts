import { GroupGameObject } from "@game/presentation/core/group-game-object";
import { WindowBase } from "./window-base";
import { SelectableWindowContents } from "..";
import { wrapIndex } from "@shared";
import { GamePorts } from "@game/presentation";
import { WindowCoverRect } from "./window-cover-rect";

/**
 * 選択系ウィンドウ共通部分
 * 選択肢の切り替えの責務を持つ
 */
export abstract class SelectableWindow<TItem, TContents extends SelectableWindowContents> extends GroupGameObject {
  #base: WindowBase;
  #contents: TContents;
  #cover: WindowCoverRect;
  #selectedIndex = 0;

  constructor(ports: GamePorts, size: { width: number, height: number }, alpha: number, createContents: (ports: GamePorts) => TContents) {
    super(ports);

    this.#base = new WindowBase(ports, size.width, size.height, alpha);
    this.#contents = createContents(ports);

    this.addChild(this.#base);
    this.addChild(this.#contents);

    this.#cover = new WindowCoverRect(ports, this.#base, 0x000000);
    this.addChild(this.#cover);
    this.#cover.setAlpha(0);
  }

  setActive(active: boolean): void {
    this.#contents.setCursorVisible(active);
  }

  setToDeactiveColor(): void {
    this.#cover.setAlpha(0.25);
  }

  setToActiveColor(): void {
    this.#cover.setAlpha(0);
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

  override bringToTop(): void {
    super.bringToTop();
    this.#base.bringToTop();
    this.#contents.bringToTop();
    this.#cover.bringToTop();
  }

  get selectedIndex(): number {
    return this.#selectedIndex;
  }

  get contents(): TContents {
    return this.#contents;
  }

  abstract getCurrent(): TItem;
  abstract get width(): number;
  abstract get height(): number;
  abstract get selectionCount(): number;
}
