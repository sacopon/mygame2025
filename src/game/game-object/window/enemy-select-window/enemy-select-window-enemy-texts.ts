import { WindowTextsVertical } from "../common/window-texts-vertical";
import { ENEMY_SELECT_WINDOW_SETTINGS } from "./enemy-select-window-constants";
import { GamePorts } from "@game/core";

/**
 * 敵選択ウィンドウのテキスト表示(複数行)
 */
export class EnemySelectWindowEnemyTexts extends WindowTextsVertical {
  constructor(ports: GamePorts, texts: string[]) {
    super(
      ports,
      texts,
      {
        fontFamily: ENEMY_SELECT_WINDOW_SETTINGS.fontFamily,
        fontSize: ENEMY_SELECT_WINDOW_SETTINGS.fontSize,
        lineHeight: ENEMY_SELECT_WINDOW_SETTINGS.lineHeight,
      });
  }
}
