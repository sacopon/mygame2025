import { ActorId } from "@game/domain";
import { SeId } from "@game/presentation";

/**
 * DomainEvent を元に生成されるプレゼンテーション層向けの演出指示
 */

// メッセージウィンドウのクリア
export type ClearMessage = {
  kind: "ClearMessage";
};

// 「${actor.name}の　こうげき！」を表示
export type AttackStarted = {
  kind: "AttackStarted";
  actorId: ActorId;
};

// 何のSEかの情報はここには必要ない？ 値の作成段階で決まる？
export type PlaySe = {
  kind: "PlaySe";
  seId: SeId;
};

// 敵がダメージを受けた時の点滅
export type EnemyDamageBlink = {
  kind: "EnemyDamageBlink";
  actorId: ActorId;
};

// 「${actor.name}に　${amount}の　ダメージ！！」(味方→敵）
export type ShowEnemyDamageText = {
  kind: "ShowEnemyDamageText";
  actorId: ActorId;
  amount: number;
};

// 味方がダメージを受けた時の画面揺れ
export type PlayerDamageShake = {
  kind: "PlayerDamageShake";
  actorId: ActorId;
};

// 「${actor.name}は　${amount}の　ダメージを　うけた！」(敵→味方）
export type ShowPlayerDamageText = {
  kind: "ShowPlayerDamageText";
  actorId: ActorId;
  amount: number;
};

export type PresentationEffect = ClearMessage
  | AttackStarted
  | PlaySe
  | EnemyDamageBlink
  | ShowEnemyDamageText
  | PlayerDamageShake
  | ShowPlayerDamageText;
