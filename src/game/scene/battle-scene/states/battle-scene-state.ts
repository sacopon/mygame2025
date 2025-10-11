import { GamePorts } from "@game/core";
import { CommandSelectWindow, EnemySelectWindow } from "@game/game-object";
import { CommandChoice } from "@game/scene/battle-scene";

/**
 * バトルシーンの共有オブジェクト
 */
export type BattleSceneContext = Readonly<{
  ports: GamePorts;
  commandSelectWindow: CommandSelectWindow;
  enemySelectWindow: EnemySelectWindow;
  commandChoices: CommandChoice[];
}>;

/**
 * バトルシーン状態
 */
export interface BattleSceneState {
  onEnter(context: BattleSceneContext): void;
  onLeave(context: BattleSceneContext): void;
  // 上に他のステートが積まれたので一時停止する
  onSuspend(): void;
  // 上のステートが取り除かれて再びアクティブになる
  onResume(): void;
  update(deltaTime: number): void;
}

export class BaseBattleSceneState implements BattleSceneState {
  #context!: BattleSceneContext;

  protected get context(): BattleSceneContext {
    return this.#context;
  }

  onEnter(context: BattleSceneContext): void {
    this.#context = context;
  }

  onLeave(_context: BattleSceneContext): void {}
  onSuspend(): void {}
  onResume(): void {}
  update(_deltaTime: number): void {}
}
