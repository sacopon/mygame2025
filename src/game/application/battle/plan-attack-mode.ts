import { Action, ActionType, ActorId, EnemyGroupId, TargetMode } from "@game/domain";
import { assertNever } from "@shared/utils";

/**
 * 各種判定ロジックをまとめたもの
 */
export type PlanDeps = {
  isAlly: (id: ActorId) => boolean;
  aliveAllies: () => ReadonlyArray<ActorId>;
  aliveEnemiesInGroup: (groupId: EnemyGroupId) => ReadonlyArray<ActorId>;
};

export function planActionTargetMode(action: Readonly<Action>, deps: PlanDeps): TargetMode {
  switch (action.actionType) {
    case ActionType.Attack:
      return planAttackActionTargetMode(action, deps);

    case ActionType.SelfDefence:
    case ActionType.Spell:  // TODO: 未実装のためとりあえずここ
    case ActionType.Item:   // TODO: 未実装のためとりあえずここ
      return { kind: "none" };

    default:
      assertNever(action.actionType);
  }
}

/**
 * actionType: ActionType.Attack の Action の selection と
 * その装備品/行動内容により TargetMode を決定する
 *
 * @param action actionType === ActionType.Attack の Action
 * @param deps 依存注入された情報源
 * @returns TargetMode
 */
export function planAttackActionTargetMode(action: Readonly<Action>, deps: PlanDeps): TargetMode {
  // 敵キャラのアクション
  if (!deps.isAlly(action.actorId)) {
    // TODO: 敵は特殊攻撃の内容によって単体/全体、敵陣営/味方陣営が決まるため
    //       先にどんな行動をするかを決める必要がある
    //       敵は「通常攻撃」も含めたいくつかの選択肢から行動する
    //       現状では敵陣営(プレイヤー側)への単体攻撃とする(誰を攻撃するかは"攻撃する直前の状況に応じて"に決めたい)
    return { kind: "single", targetId: ActorId(0) };
  }

  // 味方キャラのアクション
  switch (action.selection.kind) {
    case "none":
      // グループを選んでいない = 全体攻撃の武器を装備した状態で「攻撃」コマンドを選択した
      return { kind: "all" };

    case "group":
      // 装備している武器によりグループ or 単体攻撃
      // 現状はグループの先頭への単体攻撃で固定とする
      return { kind: "single", targetId: deps.aliveEnemiesInGroup(action.selection.groupId)[0] };

    default:
      assertNever(action.selection);
  }
}
