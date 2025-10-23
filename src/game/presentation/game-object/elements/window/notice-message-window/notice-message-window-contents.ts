import { GameObject } from "../../../../core/game-object";
import { DEFAULT_WINDOW_SETTINGS, GamePorts, TextComponent } from "../../../..";

/**
 * 警告(等)ウィンドウの中身部分
 */
export class NoticeMessageWindowContents extends GameObject {
  #text: TextComponent;
  #index: number = 0;

  constructor(ports: GamePorts, text: string) {
    super(ports);

    this.setPosition(
      4 + 2 + 2,
      DEFAULT_WINDOW_SETTINGS.borderHeight + DEFAULT_WINDOW_SETTINGS.marginTop);

    this.#text = this.addComponent(new TextComponent(
      text,
      {
        style: {
          fontFamily: DEFAULT_WINDOW_SETTINGS.fontFamily,
          fontSize: DEFAULT_WINDOW_SETTINGS.fontSize,
        }
      }))!;
  }

  setText(text: string): void {
    this.#text.text = text;
  }

  get width(): number {
    return this.#text.width;
  }

  get height(): number {
    return this.#text.height;
  }
}
