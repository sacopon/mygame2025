import { SelectableWindow } from "../common/selectable-window";
import { SPELL_SELECT_WINDOW_SETTINGS } from "./spell-select-window-constants";
import { SpellSelectWindowContents } from "./spell-select-window-contents";
import { GamePorts } from "../../../..";
import { Spell } from "@game/domain";

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
