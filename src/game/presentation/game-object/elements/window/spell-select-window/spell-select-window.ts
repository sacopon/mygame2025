import { SelectableWindow } from "../common/selectable-window";
import { SPELL_SELECT_WINDOW_SETTINGS } from "./spell-select-window-constants";
import { SpellSelectWindowContents } from "./spell-select-window-contents";
import { GamePorts } from "../../../..";
import { Spell } from "@game/domain";
import { wrapIndex } from "@shared/utils";

/**
 * 呪文選択ウィンドウ
 */
export class SpellSelectWindow extends SelectableWindow<Spell, SpellSelectWindowContents> {
  #actorName: string;
  #allSpells: ReadonlyArray<Spell> = [];
  #pageSpells: ReadonlyArray<Spell> = [];
  #pageIndex: number = 0;

  static readonly #windowSpec = {
    width:
      SPELL_SELECT_WINDOW_SETTINGS.borderWidth + SPELL_SELECT_WINDOW_SETTINGS.marginLeft
      + SPELL_SELECT_WINDOW_SETTINGS.fontSize * 12 + 4
      + SPELL_SELECT_WINDOW_SETTINGS.marginRight + SPELL_SELECT_WINDOW_SETTINGS.borderWidth,
    height: 74,
    baseAlpha: SPELL_SELECT_WINDOW_SETTINGS.baseAlpha,
    pageSize: SPELL_SELECT_WINDOW_SETTINGS.GRID_COLUMNS * SPELL_SELECT_WINDOW_SETTINGS.GRID_ROWS,
  } as const;

  constructor(ports: GamePorts, actorName: string, spells: ReadonlyArray<Spell>) {
    super(
      ports,
      { width: SpellSelectWindow.#windowSpec.width, height: SpellSelectWindow.#windowSpec.height },
      SpellSelectWindow.#windowSpec.baseAlpha,
      (ports: GamePorts) => new SpellSelectWindowContents(ports, SpellSelectWindow.#windowSpec));

    this.#actorName = actorName;
    this.#allSpells = spells;
    this.reset();
    this.#updatePage();
  }

  override setActive(active: boolean): void {
    super.setActive(active);

    if (active) {
      this.setToActiveColor();
    }
    else {
      this.setToDeactiveColor();
    }
  }

  override reset(): void {
    this.#pageIndex = 0;
    this.#updatePage();
    super.reset();
  }

  setSpells(spells: ReadonlyArray<Spell>): void {
    this.#allSpells = spells.slice();
    this.reset();
  }

  getCurrent(): Spell {
    const globalIndex = this.#pageIndex * this.#pageSize + this.selectedIndex;
    return this.#allSpells[globalIndex];
  }

  moveHorizontal(delta: -1 | 1): void {
    const maxCol = this.contents.getColumnsAt(this.currentRow);
    const newCol = this.currentColumn + delta;
    let indexInPage = this.currentRow * this.contents.columns + newCol;

    if (maxCol <= newCol) {
      this.#pageIndex = wrapIndex(this.#pageIndex + 1, this.#pageCount);
      this.#updatePage();

      // ページ切り替えの場合はカーソル位置は変更なし
      // その場所に呪文がない場合はページ内の先頭に移動
      indexInPage = this.currentRow * this.contents.columns + this.currentColumn;
      if (this.#itemCountInPage <= indexInPage) {
        indexInPage = 0;
      }
    }
    else if (newCol < 0) {
      this.#pageIndex = wrapIndex(this.#pageIndex - 1, this.#pageCount);
      this.#updatePage();

      // ページ切り替えの場合はカーソル位置は変更なし
      // その場所に呪文がない場合はページ内の先頭に移動
      indexInPage = this.currentRow * this.contents.columns + this.currentColumn;
      if (this.#itemCountInPage <= indexInPage) {
        indexInPage = 0;
      }
    }

    this.select(indexInPage);
  }

  moveVertical(delta: -1 | 1): void {
    const maxRow = this.contents.getRowsAt(this.currentColumn);
    const newRow = wrapIndex(this.currentRow + delta, maxRow);
    this.select(newRow * this.contents.columns + this.currentColumn);
  }

  // ページング本体
  #updatePage(): void {
    const start = this.#pageIndex * this.#pageSize;
    const end = start + this.#pageSize;

    this.#pageSpells = this.#allSpells.slice(start, end);
    this.contents.setSpells(this.#pageSpells);
    this.contents.setWindowTitle(this.#actorName, this.#pageIndex);
  }

  get currentColumn(): number {
    return this.selectedIndex % this.contents.columns;
  }

  get currentRow(): number {
    return Math.floor(this.selectedIndex / this.contents.columns);
  }

  get width(): number {
    return SpellSelectWindow.#windowSpec.width;
  }

  get height(): number {
    return SpellSelectWindow.#windowSpec.height;
  }

  override get selectionCount(): number {
    return this.#itemCountInPage;
  }

  get #pageSize(): number {
    return SpellSelectWindow.#windowSpec.pageSize;
  }

  get #pageCount(): number {
    return Math.ceil(this.#allSpells.length / this.#pageSize);
  }

  get #itemCountInPage(): number {
    return this.#pageSpells.length;
  }
}
