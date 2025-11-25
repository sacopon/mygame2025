import { SelectableWindowContents } from "../common/selectable-window-contents";
import { SPELL_SELECT_WINDOW_SETTINGS } from "./spell-select-window-constants";
import { DEFAULT_WINDOW_SETTINGS } from "..";
import { Position, Size, toZenkaku } from "@shared";
import { NineSliceSpriteComponent, TextComponent } from "@game/presentation/component";
import { GameObject, GamePorts } from "@game/presentation";
import { WindowTextsGrid } from "..";
import { Spell } from "@game/domain";

/**
 * 呪文選択ウィンドウの中身部分
 * (軽く実装が終わったら PagedGridSelectWindowContents にリネームして common に移動)
 */
export class SpellSelectWindowContents extends SelectableWindowContents {
  #spellNamesObject: WindowTextsGrid;
  #actorNameComponent: TextComponent;
  #separator: NineSliceSpriteComponent;

  constructor(ports: GamePorts, windowSize: Size) {
    super(ports, windowSize);

    // 呪文を選択中のアクターの名前
    const header = this.addChild(new GameObject(ports));
    this.#actorNameComponent = header.addComponent(new TextComponent("",
      {
        style: {
          fontFamily: SPELL_SELECT_WINDOW_SETTINGS.fontFamily,
          fontSize: SPELL_SELECT_WINDOW_SETTINGS.fontSize,
        },
        anchor: { x: 0.5 }, // 横方向だけウィンドウの中央座標を指定する
      }))!;

    // 名前とコマンドの区切り線
    const separator = this.addChild(new GameObject(ports));
    this.#separator = separator.addComponent(new NineSliceSpriteComponent({
        imageId: "line.png",
        border: { left: 1, top: 1, right: 1, bottom: 0 },
        size: { width: this.windowWidth - DEFAULT_WINDOW_SETTINGS.separatorWidthDiff, height: 1 },
      }))!;

    // コマンド選択肢
    this.#spellNamesObject = this.addChild(new WindowTextsGrid(
      ports,
      [],
      {
        fontFamily: SPELL_SELECT_WINDOW_SETTINGS.fontFamily,
        fontSize: SPELL_SELECT_WINDOW_SETTINGS.fontSize,
        cellWidth: 66,  // TODO: ちゃんと定数化する
        cellHeight: SPELL_SELECT_WINDOW_SETTINGS.lineHeight,
        maximumColumns: 2,
        maximumRows: 3,
      }));

    const headerTextPos = {
      x: Math.floor(this.windowWidth / 2), // ウィンドウの中央に表示したい(anchor:0.5 なので、ウィンドウ幅の1/2を指定)
      y: SPELL_SELECT_WINDOW_SETTINGS.borderHeight + SPELL_SELECT_WINDOW_SETTINGS.marginTop - 1,
    };
    header.setPosition(headerTextPos.x, headerTextPos.y);

    separator.setPosition(
      DEFAULT_WINDOW_SETTINGS.separatorOffsetX,
      header.transform.y + SPELL_SELECT_WINDOW_SETTINGS.fontSize + DEFAULT_WINDOW_SETTINGS.separatorMarginTop);

    const commandTextsPos = {
      x: SPELL_SELECT_WINDOW_SETTINGS.borderWidth + 2 + SPELL_SELECT_WINDOW_SETTINGS.fontSize,
      y: separator.transform.y + DEFAULT_WINDOW_SETTINGS.separatorHeight + DEFAULT_WINDOW_SETTINGS.separatorMarginBottom,
    };
    this.#spellNamesObject.setPosition(commandTextsPos.x, commandTextsPos.y);
  }

  override getCursorLocalPos(index: number): Position {
    const pos = this.#spellNamesObject.getCellMidY(index);

    return {
      x: this.#spellNamesObject.x + pos.x + SPELL_SELECT_WINDOW_SETTINGS.cursorMarginX,
      y: this.#spellNamesObject.y + pos.y + SPELL_SELECT_WINDOW_SETTINGS.cursorBaselineTweak,
    };
  }

  override bringToTop(): void {
    super.bringToTop();
    this.#actorNameComponent.bringToTop();
    this.#separator.bringToTop();
    this.#spellNamesObject.bringToTop();
  }

  setWindowTitle(actorName: string, pageIndex: number): void {
    this.#setHeader(`${actorName}の呪文${toZenkaku(pageIndex + 1)}`);
  }

  setSpells(spells: ReadonlyArray<Spell>): void {
    this.setItems(spells.map(s => s.name));
  }

  setItems(names: ReadonlyArray<string>): void {
    this.#spellNamesObject.setTexts(names);
  }

  getColumnsAt(row: number): number {
    return this.#spellNamesObject.getColumnsAt(row);
  }

  getRowsAt(col: number): number {
    return this.#spellNamesObject.getRowsAt(col);
  }

  #setHeader(headerText: string): void {
    this.#actorNameComponent.text = headerText;
  }

  get columns(): number {
    return this.#spellNamesObject.columns;
  }

  get rows(): number {
    return this.#spellNamesObject.rows;
  }
}
