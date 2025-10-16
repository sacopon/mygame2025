import { ListWindowContents } from "../common/list-window-contents";
import { ENEMY_SELECT_WINDOW_SETTINGS } from "./enemy-select-window-constants";
import { WindowTextsVertical } from "../..";
import { Position, Size } from "@shared";
import { GamePorts } from "@game/presentation";

function toZenkaku(value: number): string {
  // UTF-8
  return String(value).replace(/\d/g, d => String.fromCharCode(d.charCodeAt(0) + 0xFEE0));
}

/**
 * 敵選択ウィンドウの中身部分
 */
export class EnemySelectWindowContents extends ListWindowContents {
  #enemyNamesObject: WindowTextsVertical;

  constructor(ports: GamePorts, windowSize: Size, nameAndCounts: ReadonlyArray<{ name: string, count: number }>) {
    super(ports, windowSize);

    this.#enemyNamesObject = this.addChild(new WindowTextsVertical(
      ports,
      nameAndCounts.map(e => e.name),
      {
        fontFamily: ENEMY_SELECT_WINDOW_SETTINGS.fontFamily,
        fontSize: ENEMY_SELECT_WINDOW_SETTINGS.fontSize,
        lineHeight: ENEMY_SELECT_WINDOW_SETTINGS.lineHeight,
      }));

    const enemyNamesPos = {
      x: 4 + 2 + 10,
      y: ENEMY_SELECT_WINDOW_SETTINGS.borderHeight + ENEMY_SELECT_WINDOW_SETTINGS.marginTop,
    };
    this.#enemyNamesObject.setPosition(enemyNamesPos.x, enemyNamesPos.y);

    const enemyCountObject = this.addChild(new WindowTextsVertical(
      ports,
      nameAndCounts.map(e => `ー ${toZenkaku(e.count)}匹`),
      {
        fontFamily: ENEMY_SELECT_WINDOW_SETTINGS.fontFamily,
        fontSize: ENEMY_SELECT_WINDOW_SETTINGS.fontSize,
        lineHeight: ENEMY_SELECT_WINDOW_SETTINGS.lineHeight,
      }));
    const enemyCountPos = {
      x: 100,
      y: ENEMY_SELECT_WINDOW_SETTINGS.borderHeight + ENEMY_SELECT_WINDOW_SETTINGS.marginTop,
    };
    enemyCountObject.setPosition(enemyCountPos.x, enemyCountPos.y);
  }

  override getCursorLocalPos(index: number): Position {
    return {
      x: this.#enemyNamesObject.transform.x + ENEMY_SELECT_WINDOW_SETTINGS.cursorMarginX,
      y: this.#enemyNamesObject.getLineMidY(index) + ENEMY_SELECT_WINDOW_SETTINGS.cursorBaselineTweak,
    };
  }
}
