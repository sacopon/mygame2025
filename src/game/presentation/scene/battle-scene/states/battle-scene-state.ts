import { StackState } from "../../../../shared/state-stack";
import { CommandChoice } from "..";
import { UiPorts } from "../..";
import { CommandSelectWindow, EnemySelectWindow, UILayoutCoordinator } from "../../..";
import { AtomicEffect } from "@game/application";
import { DomainPorts, Action, ActorId, DomainEvent } from "@game/domain";

/**
 * バトルシーンの共有オブジェクト
 */
export type BattleSceneContext = {
  ui: Readonly<UiPorts>;
  domain: Readonly<DomainPorts>;
  allyActorIds: ReadonlyArray<ActorId>;
  enemyActorIds: ReadonlyArray<ActorId>;

  // 入力フェーズでのみ使用する UI オブジェクト
  inputUi?: {
    coordinator: UILayoutCoordinator;
    commandSelectWindow: CommandSelectWindow;
    enemySelectWindow: EnemySelectWindow;
  }

  // 入力フェーズで設定、実行フェーズで破棄
  commandChoices: ReadonlyArray<CommandChoice>;
  // 実行フェーズで設定、実行フェーズで破棄
  turnPlan?: Readonly<TurnPlan>;
  // 実行フェーズで設定、実行フェーズで破棄
  turnResolution?: Readonly<TurnResolution>;
};

/**
 * 1ターンの実行計画
 */
export type TurnPlan = Readonly<{
  // 味方陣営キャラクターの行動内容配列
  allyActions: ReadonlyArray<Action>;
  // 敵陣営キャラクターの行動内容配列
  enemyActions: ReadonlyArray<Action>;
  // 敵味方全てのキャラクターの行動内容配列
  allActions: ReadonlyArray<Action>;
}>;

/**
 * 実行計画を元に処理を行なった結果
 */
export type TurnResolution = Readonly<{
  // 行動順解決後の行動内容配列
  orderedActions: ReadonlyArray<Action>;
  // 行動内容解決後の、状態を変化させるイベント配列
  domainEvents: ReadonlyArray<DomainEvent>;
  // DomainEvent を元に生成されたプレゼンテーション層向けの演出指示
  atomicEffects: ReadonlyArray<AtomicEffect>;
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
