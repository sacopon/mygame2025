/**
 * 戦闘でのキャラクターの行動コマンド
 */
export const BattleCommand = {
  Attack: "こうげき",  // 攻撃
  Spell: "じゅもん",   // 呪文
  Item: "どうぐ",      // 道具
  Defence: "ぼうぎょ", // 防御
} as const;

export type BattleCommand = typeof BattleCommand[keyof typeof BattleCommand];
