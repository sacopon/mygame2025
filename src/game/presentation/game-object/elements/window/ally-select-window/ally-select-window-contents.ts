import { SelectableWindowContents } from "../common/selectable-window-contents";
import { ALLY_SELECT_WINDOW_SETTINGS } from "./ally-select-window-constants";
import { DEFAULT_WINDOW_SETTINGS, WindowTextsVertical } from "..";
import { Position, Size } from "@shared";
import { NineSliceSpriteComponent, TextComponent } from "@game/presentation/component";
import { GameObject, GamePorts } from "@game/presentation";

/**
 * 味方キャラクター選択ウィンドウの中身部分
 */
export class AllySelectWindowContents extends SelectableWindowContents {
  #allyNamesObject: WindowTextsVertical;
  #header: GameObject;
  #separator: GameObject;

  constructor(ports: GamePorts, windowSize: Size, actorName: string, commandTexts: ReadonlyArray<string>) {
    super(ports, windowSize);

    // 「だれに」
    this.#header = this.addChild(new GameObject(ports));
    this.#header.addComponent(new TextComponent(
      "だれに",
      {
        style: {
          fontFamily: ALLY_SELECT_WINDOW_SETTINGS.fontFamily,
          fontSize: ALLY_SELECT_WINDOW_SETTINGS.fontSize,
        },
        anchor: { x: 0.5 }, // 横方向だけウィンドウの中央座標を指定する
      }))!;

    // ヘッダとキャラクタ名の区切り線
    this.#separator = this.addChild(new GameObject(ports));
    this.#separator.addComponent(new NineSliceSpriteComponent({
        imageId: "line.png",
        border: { left: 1, top: 1, right: 1, bottom: 0 },
        size: { width: this.windowWidth - DEFAULT_WINDOW_SETTINGS.separatorWidthDiff, height: 1 },
      }));

    // 味方キャラクター名
    this.#allyNamesObject = this.addChild(new WindowTextsVertical(
      ports,
      commandTexts,
      {
        fontFamily: ALLY_SELECT_WINDOW_SETTINGS.fontFamily,
        fontSize: ALLY_SELECT_WINDOW_SETTINGS.fontSize,
        lineHeight: ALLY_SELECT_WINDOW_SETTINGS.lineHeight,
      }));

    const headerTextPos = {
      x: Math.floor(this.windowWidth / 2), // ウィンドウの中央に表示したい(anchor:0.5 なので、ウィンドウ幅の1/2を指定)
      y: ALLY_SELECT_WINDOW_SETTINGS.borderHeight + ALLY_SELECT_WINDOW_SETTINGS.marginTop - 1,
    };
    this.#header.setPosition(headerTextPos.x, headerTextPos.y);

    this.#separator.setPosition(
      DEFAULT_WINDOW_SETTINGS.separatorOffsetX,
      this.#header.transform.y + ALLY_SELECT_WINDOW_SETTINGS.fontSize + DEFAULT_WINDOW_SETTINGS.separatorMarginTop);

    const allyNamesPos = {
      x: ALLY_SELECT_WINDOW_SETTINGS.borderWidth + 2 + ALLY_SELECT_WINDOW_SETTINGS.fontSize,
      y: this.#separator.transform.y + DEFAULT_WINDOW_SETTINGS.separatorHeight + DEFAULT_WINDOW_SETTINGS.separatorMarginBottom,
    };
    this.#allyNamesObject.setPosition(allyNamesPos.x, allyNamesPos.y);
  }

  override getCursorLocalPos(index: number): Position {
    return {
      x: this.#allyNamesObject.transform.x + ALLY_SELECT_WINDOW_SETTINGS.cursorMarginX,
      y: this.#allyNamesObject.getLineMidY(index) + ALLY_SELECT_WINDOW_SETTINGS.cursorBaselineTweak,
    };
  }

  override bringToTop(): void {
    super.bringToTop();
    this.#header.bringToTop();
    this.#separator.bringToTop();
    this.#allyNamesObject.bringToTop();
  }
}
