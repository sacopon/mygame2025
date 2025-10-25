import { ListSelectWindow } from "../common/list-select-window";
import { EnemyGroupId } from "../../../../../domain/models/actor";
import { ENEMY_SELECT_WINDOW_SETTINGS } from "./enemy-select-window-constants";
import { EnemySelectWindowContents } from "./enemy-select-window-contents";
import { GamePorts } from "@game/presentation";

function calcWindowHeight(count: number): number {
  return ENEMY_SELECT_WINDOW_SETTINGS.borderHeight
    + ENEMY_SELECT_WINDOW_SETTINGS.marginTop
    + (ENEMY_SELECT_WINDOW_SETTINGS.fontSize
    + ENEMY_SELECT_WINDOW_SETTINGS.lineMargin) * Math.min(count, ENEMY_SELECT_WINDOW_SETTINGS.maxLines)
    - ENEMY_SELECT_WINDOW_SETTINGS.lineMargin
    + ENEMY_SELECT_WINDOW_SETTINGS.marginBottom
    + ENEMY_SELECT_WINDOW_SETTINGS.borderHeight;
}

/**
 * 敵選択ウィンドウの挙動や配置を司るクラス
 */
export class EnemySelectWindow extends ListSelectWindow<EnemyGroupId> {
  #enemyGroupIds: ReadonlyArray<EnemyGroupId>;

  static readonly #windowSpec = {
    width: 144,
    baseAlpha: ENEMY_SELECT_WINDOW_SETTINGS.baseAlpha,
  } as const;

  constructor(ports: GamePorts, enemies: ReadonlyArray<{ enemyGroupId: EnemyGroupId, name: string, count: number }>) {
    const height = calcWindowHeight(enemies.length);
    super(
      ports,
      { width: EnemySelectWindow.#windowSpec.width, height },
      EnemySelectWindow.#windowSpec.baseAlpha,
      (ports: GamePorts) => new EnemySelectWindowContents(ports, { width: EnemySelectWindow.#windowSpec.width, height }, enemies));

    this.#enemyGroupIds = enemies.map(enemy => enemy.enemyGroupId);
    this.reset();
  }

  getCurrent(): EnemyGroupId {
    return this.#enemyGroupIds[this.selectedIndex];
  }

  get width(): number {
    return EnemySelectWindow.#windowSpec.width;
  }

  get height(): number {
    // return EnemySelectWindow.#windowSpec.height;
    return calcWindowHeight(this.#enemyGroupIds.length);
  }

  get selectionCount(): number {
    return this.#enemyGroupIds.length;
  }
}
