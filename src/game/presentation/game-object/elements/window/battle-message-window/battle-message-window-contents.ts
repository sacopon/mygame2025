import { GameObject } from "../../../../core/game-object";
import { DEFAULT_WINDOW_SETTINGS, GamePorts, TextListComponent } from "../../../..";

/**
 * 戦闘中(結果時以外)のメッセージウィンドウの中身部分
 */
export class BattleMessageWindowContents extends GameObject {
  #textList: TextListComponent;
  #index: number = 0;

  constructor(ports: GamePorts) {
    super(ports);

    this.setPosition(
      4 + 2 + 2,
      DEFAULT_WINDOW_SETTINGS.borderHeight + DEFAULT_WINDOW_SETTINGS.marginTop);

    this.#textList = this.addComponent(new TextListComponent(
      ["", "", ""],
      {
        style: {
          fontFamily: DEFAULT_WINDOW_SETTINGS.fontFamily,
          fontSize: DEFAULT_WINDOW_SETTINGS.fontSize,
        },
        layout: {
          lineHeight: DEFAULT_WINDOW_SETTINGS.lineHeight,
        }
      }))!;
  }

  clearText(): void {
    for (let i = 0; i < this.#textList.lines.length; ++i) {
      this.#textList.setLine(i, "");
    }

    this.#index = 0;
  }

  addText(text: string): void {
    this.#textList.setLine(this.#index, text);
    ++this.#index;
  }

  // 最後の1行を削除する
  removeLastText(): void {
    // まだ最終行に達していない
    if (this.#index < this.#textList.lines.length) {
      return;
    }

    --this.#index;
    this.#textList.setLine(this.#index, "");
  }

  // 先頭行を残し、それ以降をクリアする
  removeExceptFirstText(): void {
    // まだ1行目までしか出力していない
    if (this.#index < 1) {
      return;
    }

    for (let i = 1; i < this.#textList.lines.length; ++i) {
      this.#textList.setLine(i, "");
    }

    this.#index = 1;
  }
}
