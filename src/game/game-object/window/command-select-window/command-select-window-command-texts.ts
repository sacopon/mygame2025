import { TextListComponent } from "@game/component";
import { GameObject, GamePorts } from "@game/core";
import { COMMAND_SELECT_WINDOW_SETTINGS } from "@game/game-object/window/command-select-window/command-select-window-constants";

/**
 * キャラクターのコマンド選択ウィンドウのテキスト表示(複数行)
 * TODO: 敵選択ウィンドウと合わせて WindowTextsVertical としてクラス作成する(引数として各種サイズをとる)
 */
export class CommandSelectWindowCommandTexts extends GameObject {
  #textList: TextListComponent;

  constructor(ports: GamePorts, texts: string[]) {
    super(ports);

    this.setPosition(0, 0); // 位置は CommandSelectWindow が決める
    this.#textList = this.addComponent(new TextListComponent(
      texts,
      {
        fontFamily: COMMAND_SELECT_WINDOW_SETTINGS.fontFamily,
        fontSize: COMMAND_SELECT_WINDOW_SETTINGS.fontSize,
      },
      {
        lineHeight: COMMAND_SELECT_WINDOW_SETTINGS.lineHeight,
      }))!;
  }

  get textLines() {
    return this.#textList.lines.concat();
  }

  getLineMidY(index: number) {
    const top = this.transform.y;
    return top + COMMAND_SELECT_WINDOW_SETTINGS.lineHeight * index + Math.floor(COMMAND_SELECT_WINDOW_SETTINGS.lineHeight / 2);
  }
}
