import { ListSelectWindow } from "../common/list-select-window";
import { COMMAND_SELECT_WINDOW_SETTINGS } from "./command-select-window-constants";
import { CommandSelectWindowContents } from "./command-select-window-contents";
import { GamePorts } from "../../../..";
import { BattleCommand, BattleCommandLabels } from "../../../../scene/battle-scene/core/battle-command";

/**
 * コマンド選択ウィンドウ
 */
export class CommandSelectWindow extends ListSelectWindow<BattleCommand> {
  #commands: ReadonlyArray<BattleCommand>;

  static readonly #windowSpec = {
    width:
      COMMAND_SELECT_WINDOW_SETTINGS.borderWidth + COMMAND_SELECT_WINDOW_SETTINGS.marginLeft
      + COMMAND_SELECT_WINDOW_SETTINGS.fontSize * COMMAND_SELECT_WINDOW_SETTINGS.maxCharCount
      + COMMAND_SELECT_WINDOW_SETTINGS.marginRight + COMMAND_SELECT_WINDOW_SETTINGS.borderWidth,
    height: 90,
    baseAlpha: COMMAND_SELECT_WINDOW_SETTINGS.baseAlpha,
  } as const;

  constructor(ports: GamePorts, commands: ReadonlyArray<BattleCommand>) {
    super(
      ports,
      { width: CommandSelectWindow.#windowSpec.width, height: CommandSelectWindow.#windowSpec.height },
      CommandSelectWindow.#windowSpec.baseAlpha,
      (ports: GamePorts) => new CommandSelectWindowContents(ports, CommandSelectWindow.#windowSpec, "", commands.map(c => BattleCommandLabels[c])));

    this.#commands = commands;
    this.reset();
  }

  setActorName(actorName: string): void {
    (this.contents as CommandSelectWindowContents).setActorName(actorName);
  }

  getCurrent(): BattleCommand {
    return this.#commands[this.selectedIndex];
  }

  get width(): number {
    return CommandSelectWindow.#windowSpec.width;
  }

  get height(): number {
    return CommandSelectWindow.#windowSpec.height;
  }

  get selectionCount(): number {
    return this.#commands.length;
  }
}
