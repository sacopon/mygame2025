import { Action } from "@game/domain/models/action";
import { RandomPort } from "@game/presentation";

/**
 * 行動順を決定する
 * (現時点では仮に ActroId の降順で並べるだけ)
 *
 * @param actions 行動内容
 * @returns 行動順に並べられたアクション列
 */
export function planTurnOrder<T extends Action>(actions: ReadonlyArray<T>, random: RandomPort): ReadonlyArray<T> {
  // 引数の配列は変更しない
  // テスト的に行動は ActorId の降順とする(ActorId なので重複はない)
  const sortedActions = random.shuffle(actions);

  return sortedActions;
}
