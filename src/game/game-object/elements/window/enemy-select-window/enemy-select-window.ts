import { ListSelectWindow } from "../common/list-select-window";
import { ENEMY_SELECT_WINDOW_SETTINGS } from "./enemy-select-window-constants";
import { EnemySelectWindowContents } from "./enemy-select-window-contents";
import { GamePorts } from "@game/core";

/**
 * 敵選択ウィンドウの挙動や配置を司るクラス
 */
export class EnemySelectWindow extends ListSelectWindow<string> {
  #enemyNames: string[];

  static readonly #windowSpec = {
    width: 144,
    height: ENEMY_SELECT_WINDOW_SETTINGS.borderHeight
      + ENEMY_SELECT_WINDOW_SETTINGS.marginTop
      + (ENEMY_SELECT_WINDOW_SETTINGS.fontSize
      + ENEMY_SELECT_WINDOW_SETTINGS.lineMargin) * ENEMY_SELECT_WINDOW_SETTINGS.maxLines
      - ENEMY_SELECT_WINDOW_SETTINGS.lineMargin
      + ENEMY_SELECT_WINDOW_SETTINGS.marginBottom
      + ENEMY_SELECT_WINDOW_SETTINGS.borderHeight,
    baseAlpha: ENEMY_SELECT_WINDOW_SETTINGS.baseAlpha,
  } as const;

  constructor(ports: GamePorts, enemies: { name: string, count: number }[]) {
    super(
      ports,
      { width: EnemySelectWindow.#windowSpec.width, height: EnemySelectWindow.#windowSpec.height },
      EnemySelectWindow.#windowSpec.baseAlpha,
      (ports: GamePorts) => new EnemySelectWindowContents(ports, enemies));

    this.#enemyNames = enemies.map(e => e.name);
    this.reset();
  }

  getCurrent(): string {
    return this.#enemyNames[this.selectedIndex];
  }

  get width(): number {
    return EnemySelectWindow.#windowSpec.width;
  }

  get height(): number {
    return EnemySelectWindow.#windowSpec.height;
  }

  get selectionCount(): number {
    return this.#enemyNames.length;
  }
}
