import { Action, TurnAgility, TurnSnapshot } from "@game/domain";

/**
 * 行動順を決定する
 * (現時点では仮に ActroId の降順で並べるだけ)
 *
 * @param actions 行動内容
 * @returns 行動順に並べられたアクション列
 */
export function planTurnOrder<T extends Action>(actions: ReadonlyArray<T>, turn: TurnSnapshot): ReadonlyArray<T> {
  // 引数の配列は変更しない
  const sortedActions = [...actions]
    .sort((a, b) => {
      const aAgi = turn.agilityByActorId.get(a.actorId) ?? TurnAgility.of(0);
      const bAgi = turn.agilityByActorId.get(b.actorId) ?? TurnAgility.of(0);
      return bAgi.value - aAgi.value;
    });

  return sortedActions;
}
