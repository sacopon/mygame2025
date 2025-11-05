import { ActorId } from "@game/domain";
import { BattleCommand } from "./battle-command";

export type BattleCommandFlowType = typeof BattleCommandDecider.FlowType[keyof typeof BattleCommandDecider.FlowType];

export type BattleCommandNextFlow = {
  kind: BattleCommandFlowType,
}

/**
 * 各コマンドが選択された際の有効性の確認や次の遷移先の決定などを行う
 */
export class BattleCommandDecider {
  static readonly FlowType = {
    /** 即時確定するコマンド */
    Immediate: "immediate",
    /** 対象(敵)が必要なコマンド */
    NeedEnemyTarget: "needEnemyTarget",
    /** 未実装のコマンド */
    NotImplement: "notImplement",
  } as const;

  static next(actorId: ActorId, command: BattleCommand): BattleCommandNextFlow {
    switch (command) {
      case BattleCommand.Attack:
        return { kind: BattleCommandDecider.FlowType.NeedEnemyTarget };

      case BattleCommand.Defence:
        return { kind: BattleCommandDecider.FlowType.Immediate };

      case BattleCommand.Spell:
        // TODO: 呪文選択ウィンドウを作り、FlotType.NeedSpellSelect を設ける
        return { kind: BattleCommandDecider.FlowType.NeedEnemyTarget };

      case BattleCommand.Item:
        return { kind: BattleCommandDecider.FlowType.NotImplement };

      default:
        // TODO: 未実装
        throw new Error("Command Not Implement.");
    }
  }
}
