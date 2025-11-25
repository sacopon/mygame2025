import { SelectableWindow } from "../common/selectable-window";
import { ALLY_SELECT_WINDOW_SETTINGS } from "./ally-select-window-constants";
import { AllySelectWindowContents } from "./ally-select-window-contents";
import { GamePorts } from "../../../..";
import { ActorId } from "@game/domain";

/**
 * 味方キャラクター選択ウィンドウ
 */
export class AllySelectWindow extends SelectableWindow<{ actorId: ActorId; name: string }, AllySelectWindowContents> {
  #allies: ReadonlyArray<{ actorId: ActorId; name: string }>;

  static readonly #windowSpec = {
    width:
      ALLY_SELECT_WINDOW_SETTINGS.borderWidth + ALLY_SELECT_WINDOW_SETTINGS.marginLeft
      + ALLY_SELECT_WINDOW_SETTINGS.fontSize * ALLY_SELECT_WINDOW_SETTINGS.maxCharCount
      + ALLY_SELECT_WINDOW_SETTINGS.marginRight + ALLY_SELECT_WINDOW_SETTINGS.borderWidth,
    height: 90,
    baseAlpha: ALLY_SELECT_WINDOW_SETTINGS.baseAlpha,
  } as const;

  constructor(ports: GamePorts, allies: ReadonlyArray<{ actorId: ActorId; name: string }>) {
    super(
      ports,
      { width: AllySelectWindow.#windowSpec.width, height: AllySelectWindow.#windowSpec.height },
      AllySelectWindow.#windowSpec.baseAlpha,
      (ports: GamePorts) => new AllySelectWindowContents(ports, AllySelectWindow.#windowSpec, "", allies.map(a => a.name)));

    this.#allies = allies;
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

  getCurrent(): { actorId: ActorId; name: string; } {
    return this.#allies[this.selectedIndex];
  }

  get width(): number {
    return AllySelectWindow.#windowSpec.width;
  }

  get height(): number {
    return AllySelectWindow.#windowSpec.height;
  }

  get selectionCount(): number {
    return this.#allies.length;
  }
}
