import { ActorId, EnemyGroupId, SpellId } from "@game/domain";
import { BattleCommand } from "./battle-command";

export type AllyTarget       = { kind: "ally";       actorId: ActorId };
export type EnemyGroupTarget = { kind: "enemyGroup"; groupId: EnemyGroupId };
export type CommandTarget    = EnemyGroupTarget | AllyTarget;

// 各キャラクターのコマンド選択結果
export type CommandChoice =
  | {
      // 攻撃時の型
      actorId: ActorId;                      // 誰が
      command: typeof BattleCommand.Attack;  // どのコマンド(攻撃固定)
      target: EnemyGroupTarget;              // 対象(敵グループ)
    }
  | {
      // 防御時の型
      actorId: ActorId;                      // 誰が
      command: typeof BattleCommand.Defence; // どのコマンド(防御固定)
      target?: never;
    }
  | {
      // 呪文時の型
      actorId: ActorId;                    // 誰が
      command: typeof BattleCommand.Spell; // どのコマンド(呪文)
      spellId: SpellId;                    // どの呪文
      target?: CommandTarget;              // 対象(味方の場合は ActorId, 敵の場合は EnemyGroupId となる)
    }
  | {
      // アイテム時の型
      actorId: ActorId;                    // 誰が
      command: typeof BattleCommand.Item; // どのコマンド(道具)
      target?: CommandTarget;              // 対象(味方の場合は ActorId, 敵の場合は EnemyGroupId となる)
    };
