import { ListWindowContents } from "../common/list-window-contents";
import { COMMAND_SELECT_WINDOW_SETTINGS } from "./command-select-window-constants";
import { DEFAULT_WINDOW_SETTINGS, WindowTextsVertical } from "..";
import { Position, Size } from "@shared";
import { NineSliceSpriteComponent, TextComponent } from "@game/presentation/component";
import { GameObject, GamePorts } from "@game/presentation";

/**
 * コマンド選択ウィンドウの中身部分
 */
export class CommandSelectWindowContents extends ListWindowContents {
  #commandTextsObject: WindowTextsVertical;
  #actorNameComponent: TextComponent;

  constructor(ports: GamePorts, windowSize: Size, actorName: string, commandTexts: ReadonlyArray<string>) {
    super(ports, windowSize);

    // コマンドを入力中のアクターの名前
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

    // 名前とコマンドの区切り線
    const separator = this.addChild(new GameObject(ports));
    separator.addComponent(new NineSliceSpriteComponent({
        imageId: "line.png",
        border: { left: 1, top: 1, right: 1, bottom: 0 },
        size: { width: this.windowWidth - DEFAULT_WINDOW_SETTINGS.separatorWidthDiff, height: 1 },
      }));

    // コマンド選択肢
    this.#commandTextsObject = this.addChild(new WindowTextsVertical(
      ports,
      commandTexts,
      {
        fontFamily: COMMAND_SELECT_WINDOW_SETTINGS.fontFamily,
        fontSize: COMMAND_SELECT_WINDOW_SETTINGS.fontSize,
        lineHeight: COMMAND_SELECT_WINDOW_SETTINGS.lineHeight,
      }));

    const headerTextPos = {
      x: Math.floor(this.windowWidth / 2), // ウィンドウの中央に表示したい(anchor:0.5 なので、ウィンドウ幅の1/2を指定)
      y: COMMAND_SELECT_WINDOW_SETTINGS.borderHeight + COMMAND_SELECT_WINDOW_SETTINGS.marginTop - 1,
    };
    header.setPosition(headerTextPos.x, headerTextPos.y);

    separator.setPosition(
      DEFAULT_WINDOW_SETTINGS.separatorOffsetX,
      header.transform.y + COMMAND_SELECT_WINDOW_SETTINGS.fontSize + DEFAULT_WINDOW_SETTINGS.separatorMarginTop);

    const commandTextsPos = {
      x: COMMAND_SELECT_WINDOW_SETTINGS.borderWidth + 2 + COMMAND_SELECT_WINDOW_SETTINGS.fontSize,
      y: separator.transform.y + DEFAULT_WINDOW_SETTINGS.separatorHeight + DEFAULT_WINDOW_SETTINGS.separatorMarginBottom,
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
