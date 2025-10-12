import { ListWindowContents } from "../common/list-window-contents";
import { COMMAND_SELECT_WINDOW_SETTINGS } from "./command-select-window-constants";
import { WindowTextsVertical } from "../common";
import { Position, Size } from "@shared";
import { TextComponent } from "@game/component";
import { GameObject, GamePorts } from "@game/core";
import { BattleCommand } from "@game/scene";

/**
 * コマンド選択ウィンドウの中身部分
 */
export class CommandSelectWindowContents extends ListWindowContents {
  #commandTextsObject: WindowTextsVertical;
  #actorNameComponent: TextComponent;

  constructor(ports: GamePorts, windowSize: Size, actorName: string, commands: BattleCommand[]) {
    super(ports, windowSize);

    const header = this.addChild(new GameObject(ports));
    this.#actorNameComponent = header.addComponent(new TextComponent(
      actorName,
      {
        style: {
          fontFamily: COMMAND_SELECT_WINDOW_SETTINGS.fontFamily,
          fontSize: COMMAND_SELECT_WINDOW_SETTINGS.fontSize,
        },
        anchor: { x: 0.5 }, // 横方向だけウィンドウの中央座標を指定する
      }))!;

    this.#commandTextsObject = this.addChild(new WindowTextsVertical(
      ports,
      commands,
      {
        fontFamily: COMMAND_SELECT_WINDOW_SETTINGS.fontFamily,
        fontSize: COMMAND_SELECT_WINDOW_SETTINGS.fontSize,
        lineHeight: COMMAND_SELECT_WINDOW_SETTINGS.lineHeight,
      }));

    const headerTextPos = {
      x: Math.floor(this.windowWidth / 2), // ウィンドウの中央に表示したい(anchor:0.5 なので、ウィンドウ幅の1/2を指定)
      y: 0, // 選択肢たちより１行分 + 区切り線の分だけ上に表示したい
    };
    header.setPosition(headerTextPos.x, headerTextPos.y);

    const commandTextsPos = {
      x: COMMAND_SELECT_WINDOW_SETTINGS.borderWidth + 2 + COMMAND_SELECT_WINDOW_SETTINGS.fontSize,
      y: COMMAND_SELECT_WINDOW_SETTINGS.borderHeight + COMMAND_SELECT_WINDOW_SETTINGS.marginTop,
    };
    this.#commandTextsObject.setPosition(commandTextsPos.x, commandTextsPos.y);
  }

  override getCursorLocalPos(index: number): Position {
    return {
      x: this.#commandTextsObject.transform.x + COMMAND_SELECT_WINDOW_SETTINGS.cursorMarginX,
      y: this.#commandTextsObject.getLineMidY(index) + COMMAND_SELECT_WINDOW_SETTINGS.cursorBaselineTweak,
    };
  }

  setActorName(actorName: string) {
    this.#actorNameComponent.text = actorName;
  }
}
