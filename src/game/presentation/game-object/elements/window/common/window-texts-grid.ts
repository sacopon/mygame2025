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
  maximumColumns: number;
  /** 最大行数 */
  maximumRows: number;
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
    this.#createLabels(style.maximumColumns * style.maximumRows);
    this.setTexts(texts);
  }

  get columns(): number {
    return this.#style.maximumColumns;
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

  override bringToTop(): void {
    super.bringToTop();
    this.#labels.forEach(label => {
      label.getComponent(TextComponent.typeId)?.bringToTop();
    });
  }

  #createLabels(maximumTextCount: number): void {
    while (this.#labels.length < maximumTextCount) {
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
  }

  #getCellTopLeft(index: number): Position {
    const col = index % this.#style.maximumColumns;
    const row = Math.floor(index / this.#style.maximumColumns);

    const left = (this.#style.cellWidth + this.#style.columnGap) * col;
    const top  = (this.#style.cellHeight + this.#style.rowGap) * row;

    return {
      x: left,
      y: top,
    };
  }
}
