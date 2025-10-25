import { type BattleSceneContext } from "../battle-scene";
import { StackState } from "../../../../shared/state-stack";
import { BattleScene } from "..";
import { PresentationEffect } from "@game/application";
import { Action, DomainEvent, PlannedAction } from "@game/domain";

/**
 * 1ターンの実行計画
 */
export type TurnPlan = Readonly<{
  // 味方陣営キャラクターの行動内容配列
  allyActions: ReadonlyArray<Action>;
  // 敵陣営キャラクターの行動内容配列
  enemyActions: ReadonlyArray<Action>;
  // 敵味方全てのキャラクターの行動内容配列(mode格納済み)
  plannedAllActions: ReadonlyArray<PlannedAction>;
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
  atomicEffects: ReadonlyArray<PresentationEffect>;
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
  #scene: BattleScene;
  #context!: BattleSceneContext;

  constructor(scene: BattleScene) {
    this.#scene = scene;
  }

  protected get scene(): BattleScene {
    return this.#scene;
  }

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
export { BattleSceneContext };

