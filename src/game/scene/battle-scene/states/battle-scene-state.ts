import { StackState } from "../../../shared/state-stack";
import { CommandChoice } from "..";
import { GamePorts } from "@game/core";
import { CommandSelectWindow, EnemySelectWindow } from "@game/game-object";

/**
 * バトルシーンの共有オブジェクト
 */
export type BattleSceneContext = Readonly<{
  ports: GamePorts;
  commandSelectWindow: CommandSelectWindow;
  enemySelectWindow: EnemySelectWindow;
  commandChoices: CommandChoice[];
}>;

export interface BattleSceneState extends StackState<BattleSceneContext> {
  onEnter(context: BattleSceneContext): void;
  onLeave(context: BattleSceneContext): void;
  onSuspend(): void;
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
