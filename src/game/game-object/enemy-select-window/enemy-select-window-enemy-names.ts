import { TextListComponent } from "@game/component";
import { GameObject, GamePorts } from "@game/core";
import { ENEMY_SELECT_WINDOW_SETTINGS } from "@game/game-object/enemy-select-window";

export class EnemySelectWindowEnemyNames extends GameObject {
  #textList: TextListComponent;

  constructor(ports: GamePorts) {
    super(ports);

    this.setPosition(0, 0); // 位置は EnemySelectWindow が決める
    this.#textList = this.addComponent(new TextListComponent(
      ["キングスライム　ー　８ぴき", "グリズリー　　ー　８ぴき", "さまようよろい　ー　８ぴき", "キングスライム　ー　８ぴき", "スライム　ー　８ぴき"],
      {
        fontFamily: "BestTen",
        fontSize: ENEMY_SELECT_WINDOW_SETTINGS.fontSize,
      },
      {
        lineHeight: ENEMY_SELECT_WINDOW_SETTINGS.lineHeight,
      }))!;
  }
}
