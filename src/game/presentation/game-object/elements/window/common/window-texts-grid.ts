import { GroupGameObject } from "../../../../core/group-game-object";
import { GameObject, TextComponent } from "../../../..";
import { GamePorts } from "@game/presentation";
import { Position } from "@shared";

type WindowTextsGridStyle = {
  fontFamily: string;
  fontSize: number;
  /** 1マスの縦幅（行間を含む） */
  cellHeight: number;
  /** 1マスの横幅 */
  cellWidth: number;
  /** 列数 */
  columns: number;
  /** 列間のスペース（オプション） */
  columnGap?: number;
  /** 行間の追加オフセット（オプション） */
  rowGap?: number;
};

export class WindowTextsGrid extends GroupGameObject {
  #labels: GameObject[] = [];
  #style: Required<WindowTextsGridStyle>;

  constructor(ports: GamePorts, texts: ReadonlyArray<string>, style: WindowTextsGridStyle) {
    super(ports);

    this.#style = {
      ...style,
      columnGap: style.columnGap ?? 0,
      rowGap: style.rowGap ?? 0,
    };

    this.setPosition(0, 0);
    this.#createLabels(texts);
  }

  get columns(): number {
    return this.#style.columns;
  }

  get rows(): number {
    return Math.ceil(this.#labels.filter(l => l.visible).length / this.columns);
  }

  getColumnsAt(row: number): number {
    return this.#labels.filter(l => l.visible).length <= (row + 1) * this.columns - 1 ? this.columns - 1 : this.columns;
  }

  getRowsAt(col: number): number {
    return (this.#labels.filter(l => l.visible).length - 1) % this.columns < col % this.columns ? this.rows - 1 : this.rows;
  }

  getCellMidY(index: number): Position {
    const pos = this.#getCellTopLeft(index);
    return {
      x: pos.x,
      y: pos.y + Math.floor(this.#style.cellHeight / 2),
    };
  }

  setTexts(texts: ReadonlyArray<string>): void {
    const n = texts.length;

    // 足りない分を追加
    while (this.#labels.length < n) {
      const label = this.addChild(new GameObject(this.ports));
      label.addComponent(new TextComponent(
        "",
        {
          style: {
            fontFamily: this.#style.fontFamily,
            fontSize: this.#style.fontSize,
          },
        }))!;
      this.#labels.push(label);
    }

    // ラベル設定
    for (let i = 0; i < this.#labels.length; ++i) {
      const label = this.#labels[i];
      const textComp = label.getComponent(TextComponent.typeId)!;

      // 使用しない分は非表示(削除まではしない)
      if (n <= i) {
        textComp.text = "";
        label.visible = false;
        continue;
      }

      textComp.text = texts[i];
      const pos = this.#getCellTopLeft(i);
      label.visible = true;
      label.setPosition(pos.x, pos.y);
    }
  }

  #createLabels(texts: ReadonlyArray<string>): void {
    this.setTexts(texts);
  }

  #getCellTopLeft(index: number): Position {
    const col = index % this.#style.columns;
    const row = Math.floor(index / this.#style.columns);

    const left = (this.#style.cellWidth + this.#style.columnGap) * col;
    const top  = (this.#style.cellHeight + this.#style.rowGap) * row;

    return {
      x: left,
      y: top,
    };
  }
}
