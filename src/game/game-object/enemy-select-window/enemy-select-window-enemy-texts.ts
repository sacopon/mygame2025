import { TextListComponent } from "@game/component";
import { GameObject, GamePorts } from "@game/core";
import { ENEMY_SELECT_WINDOW_SETTINGS } from "@game/game-object/enemy-select-window";

/**
 * 敵選択ウィンドウのテキスト表示(複数行)
 */
export class EnemySelectWindowEnemyTexts extends GameObject {
  #textList: TextListComponent;

  constructor(ports: GamePorts, texts: string[]) {
    super(ports);

    this.setPosition(0, 0); // 位置は EnemySelectWindow が決める
    this.#textList = this.addComponent(new TextListComponent(
      texts,
      {
        fontFamily: "BestTen",
        fontSize: ENEMY_SELECT_WINDOW_SETTINGS.fontSize,
      },
      {
        lineHeight: ENEMY_SELECT_WINDOW_SETTINGS.lineHeight,
      }))!;
  }
}
