/**
 * 戦闘でのキャラクターの行動コマンド
 */
export const BattleCommand = {
  Attack: "Attack",  // 攻撃
  Spell: "Spell",   // 呪文
  Item: "Item",      // 道具
  Defence: "Defence", // 防御
} as const;

export type BattleCommand = typeof BattleCommand[keyof typeof BattleCommand];

export const BattleCommandLabels = {
  [BattleCommand.Attack]: "こうげき",
  [BattleCommand.Spell]: "じゅもん",
  [BattleCommand.Item]: "どうぐ",
  [BattleCommand.Defence]: "ぼうぎょ",
} satisfies Record<BattleCommand, string>;
