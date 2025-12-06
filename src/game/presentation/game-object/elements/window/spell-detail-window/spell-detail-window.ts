import { GroupGameObject } from "../../../../core/group-game-object";
import { DEFAULT_WINDOW_SETTINGS } from "../constants/window-constants";
import { WindowBase } from "..";
import { GamePorts } from "../../../..";
import { SpellDetailWindowContents } from "./spell-detail-window-contents";
import { Mp, Spell } from "@game/domain";

/**
 * 呪文詳細ウィンドウ(説明文/消費MP)
 */
export class SpellDetailWindow extends GroupGameObject {
  static readonly #windowSpec = {
    width: 74,
    height: 74,
    baseAlpha: DEFAULT_WINDOW_SETTINGS.baseAlpha,
  } as const;

  #base: WindowBase;
  #content: SpellDetailWindowContents;

  constructor(ports: GamePorts) {
    super(ports);

    this.#base = this.addChild(new WindowBase(ports, SpellDetailWindow.#windowSpec.width, SpellDetailWindow.#windowSpec.height, SpellDetailWindow.#windowSpec.baseAlpha));
    this.#content = this.addChild(new SpellDetailWindowContents(ports, SpellDetailWindow.#windowSpec));
  }

  setContent(spell: Spell, currentMp: Mp): void {
    this.#content.setData(spell.description.split("\n"), spell.cost, currentMp);
  }

  get width(): number {
    return SpellDetailWindow.#windowSpec.width;
  }

  get height(): number {
    return SpellDetailWindow.#windowSpec.height;
  }

  override bringToTop(): void {
    super.bringToTop();
    this.#base.bringToTop();
    this.#content.bringToTop();
  }
}
