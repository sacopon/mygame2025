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
  #spells: ReadonlyArray<Spell> = [];
  static readonly #windowSpec = {
    width:
      SPELL_SELECT_WINDOW_SETTINGS.borderWidth + SPELL_SELECT_WINDOW_SETTINGS.marginLeft
      + SPELL_SELECT_WINDOW_SETTINGS.fontSize * 12 + 4
      + SPELL_SELECT_WINDOW_SETTINGS.marginRight + SPELL_SELECT_WINDOW_SETTINGS.borderWidth,
    height: 74,
    baseAlpha: SPELL_SELECT_WINDOW_SETTINGS.baseAlpha,
  } as const;

  constructor(ports: GamePorts) {
    super(
      ports,
      { width: SpellSelectWindow.#windowSpec.width, height: SpellSelectWindow.#windowSpec.height },
      SpellSelectWindow.#windowSpec.baseAlpha,
      (ports: GamePorts) => new SpellSelectWindowContents(ports, SpellSelectWindow.#windowSpec));

    this.reset();
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

  setActorName(actorName: string): void {
    this.contents.setActorName(actorName);
  }

  setSpells(spells: ReadonlyArray<Spell>): void {
    this.#spells = spells.slice();
    this.contents.setSpells(this.#spells);
    this.reset();
  }

  getCurrent(): Spell {
    return this.#spells[this.selectedIndex];
  }

  moveHorizontal(delta: -1 | 1): void {
    const maxCol = this.contents.getColumnsAt(this.currentRow);
    const newCol = wrapIndex(this.currentColumn + delta, maxCol);
    this.select(this.currentRow * this.contents.columns + newCol);
  }

  moveVertical(delta: -1 | 1): void {
    const maxRow = this.contents.getRowsAt(this.currentColumn);
    const newRow = wrapIndex(this.currentRow + delta, maxRow);
    this.select(newRow * this.contents.columns + this.currentColumn);
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

  get selectionCount(): number {
    return this.#spells.length;
  }
}
