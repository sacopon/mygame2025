import { GroupGameObject } from "../../../../core/group-game-object";
import { DEFAULT_WINDOW_SETTINGS, GameObject, GamePorts, NineSliceSpriteComponent, TextComponent, TextListComponent } from "../../../..";
import { Size, toZenkaku } from "@shared";
import { Mp, SpellCost } from "@game/domain";

/**
 * 呪文詳細テキスト
 */
class SpellDetailText extends GameObject {
  #text: TextListComponent;
  #textStrings: string[] = ["", "", ""];  // 3行分のテキスト領域

  constructor(ports: GamePorts) {
    super(ports);

    this.#text = this.addComponent(new TextListComponent(
      this.#textStrings,
      {
        style: {
          fontFamily: DEFAULT_WINDOW_SETTINGS.fontFamily,
          fontSize: DEFAULT_WINDOW_SETTINGS.fontSize,
        }
      }))!;
  }

  get lineCount(): number {
    return 3;
  }

  setTexts(texts: string[]): void {
    for (let i = 0; i < this.#text.lines.length; ++i) {
      this.#text.setLine(i, texts.length <= i ? "" : texts[i]);
    }
  }
}

/**
 * 消費MP/最大MP 表示
 */
class MpCostText extends GameObject {
  #text: TextComponent;

  constructor(ports: GamePorts) {
    super(ports);

    this.#text = this.addComponent(new TextComponent(
      "",
      {
        style: {
          fontFamily: DEFAULT_WINDOW_SETTINGS.fontFamily,
          fontSize: DEFAULT_WINDOW_SETTINGS.fontSize,
        }
      }))!;
    this.setData(SpellCost.of(SpellCost.MAX), Mp.of(Mp.MAX));
  }

  setData(cost: SpellCost, mp: Mp): void {
    const costText = toZenkaku(cost.value).padStart(String(SpellCost.MAX).length, "　");
    const mpText = toZenkaku(mp.value).padStart(String(Mp.MAX).length, "　");

    this.#text.text = `${costText}／${mpText}`;
  }

  get width(): number {
    return this.#text.width;
  }
}

/**
 * 呪文詳細ウィンドウの中身部分
 */
export class SpellDetailWindowContents extends GroupGameObject {
  #detailText: SpellDetailText;
  #separator: GameObject;
  #mpCostText: MpCostText;

  constructor(ports: GamePorts, windowSize: Size) {
    super(ports);

    //  説明文
    this.#detailText = this.addChild(new SpellDetailText(ports));

    // 説明文と消費MPの区切り線
    this.#separator = this.addChild(new GameObject(ports));
    this.#separator.addComponent(new NineSliceSpriteComponent({
        imageId: "line.png",
        border: { left: 1, top: 1, right: 1, bottom: 0 },
        size: { width: windowSize.width - DEFAULT_WINDOW_SETTINGS.separatorWidthDiff, height: 1 },
      }));

    // 消費MP
    this.#mpCostText = this.addChild(new MpCostText(ports));

    // 位置設定
    this.#detailText.setPosition(
      DEFAULT_WINDOW_SETTINGS.borderWidth + DEFAULT_WINDOW_SETTINGS.marginLeft,
      DEFAULT_WINDOW_SETTINGS.borderHeight + DEFAULT_WINDOW_SETTINGS.marginTop);

    this.#separator.setPosition(
      Math.trunc(DEFAULT_WINDOW_SETTINGS.separatorWidthDiff / 2),
      this.#detailText.y +
      DEFAULT_WINDOW_SETTINGS.lineHeight * this.#detailText.lineCount - DEFAULT_WINDOW_SETTINGS.lineMargin +
      DEFAULT_WINDOW_SETTINGS.separatorMarginBottom);

    this.#mpCostText.setPosition(
      windowSize.width - this.#mpCostText.width - DEFAULT_WINDOW_SETTINGS.borderWidth,
      this.#separator.y + DEFAULT_WINDOW_SETTINGS.separatorHeight + DEFAULT_WINDOW_SETTINGS.separatorMarginBottom);
  }

  setData(detail: string[], cost: SpellCost, mp: Mp): void {
    this.#detailText.setTexts(detail);
    this.#mpCostText.setData(cost, mp);
  }

  override bringToTop(): void {
    super.bringToTop();
    this.#detailText.bringToTop();
    this.#separator.bringToTop();
    this.#mpCostText.bringToTop();
  }
}
