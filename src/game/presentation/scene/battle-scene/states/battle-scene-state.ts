import { StackState } from "../../../../shared/state-stack";
import { CommandChoice } from "..";
import { CommandSelectWindow, EnemySelectWindow } from "../../../game-object/elements/window";
import { UiPorts } from "../../core";
import { DomainPorts, Action } from "@game/domain";

/**
 * バトルシーンの共有オブジェクト
 */
export type BattleSceneContext = {
  ui: Readonly<UiPorts>;
  domain: Readonly<DomainPorts>;
  commandSelectWindow: CommandSelectWindow;
  enemySelectWindow: EnemySelectWindow;
  // 入力フェーズで設定、実行フェーズで破棄
  commandChoices: ReadonlyArray<CommandChoice>;
  // 実行フェーズで設定、実行フェーズで破棄
  turnPlan?: Readonly<TurnPlan>;
};

/**
 * 1ターンの実行計画
 */
type TurnPlan = Readonly<{
  allyActions: ReadonlyArray<Action>;
  enemyActions: ReadonlyArray<Action>;
  allActions: ReadonlyArray<Action>;
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
