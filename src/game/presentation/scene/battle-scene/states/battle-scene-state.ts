import { StackState } from "../../../../shared/state-stack";
import { CommandChoice } from "..";
import { CommandSelectWindow, EnemySelectWindow } from "../../../game-object/elements/window";
import { UiPorts } from "../../core";
import { DomainPorts } from "@game/domain";

/**
 * バトルシーンの共有オブジェクト
 */
export type BattleSceneContext = Readonly<{
  ui: UiPorts;
  domain: DomainPorts;
  commandSelectWindow: CommandSelectWindow;
  enemySelectWindow: EnemySelectWindow;
  commandChoices: CommandChoice[];
}>;

/**
 * バトルシーンのステートのインターフェース
 */
export interface BattleSceneState extends StackState<BattleSceneContext> {
  onEnter(context: BattleSceneContext): void;
  onLeave(context: BattleSceneContext): void;
  onSuspend(): void;
  onResume(): void;
  update(deltaTime: number): void;
}

/**
 * バトルシーンのステートの共通基底クラス
 */
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
