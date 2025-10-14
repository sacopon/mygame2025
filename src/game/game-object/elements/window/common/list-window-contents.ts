import { GroupGameObject } from "../../../../presentation/core/group-game-object";
import { WindowCursor } from "./window-cursor";
import { Position, Size } from "@shared";
import { GamePorts } from "@game/presentation";

/**
 * 選択系ウィンドウの中身
 * 中身のレイアウトについて責務を持つ
 */
export abstract class ListWindowContents extends GroupGameObject {
  #cursor!: WindowCursor;
  #windowSize: Size;

  constructor(ports: GamePorts, windowSize: Size) {
    super(ports);
    this.#windowSize = windowSize;
  }

  get windowWidth(): number {
    return this.#windowSize.width;
  }

  get windowHeight(): number {
    return this.#windowSize.height;
  }

  setCursorVisible(isEnable: boolean): void {
    this.#ensureCursor().setEnable(isEnable);
  }

  setCursorIndex(index: number): void {
    const localPos = this.getCursorLocalPos(index);
    this.#ensureCursor().setCursorMiddleRight(localPos.x, localPos.y);
  }

  abstract getCursorLocalPos(index: number): Position;

  #ensureCursor(): WindowCursor {
    if (!this.#cursor) {
      this.#cursor = this.addChild(new WindowCursor(this.ports));
    }

    return this.#cursor;
  }
};
