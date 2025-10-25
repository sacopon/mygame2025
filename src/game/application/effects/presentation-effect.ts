import { ActorId, BattleDomainState } from "@game/domain";
import { SeId } from "@game/presentation";

/**
 * DomainEvent を元に生成されるプレゼンテーション層向けの演出指示
 */

// 状態の反映
export type ApplyState = {
  kind: "ApplyState";
  state: Readonly<BattleDomainState>,
};

// メッセージウィンドウのクリア
export type ClearMessageWindowText = {
  kind: "ClearMessageWindowText";
};

// 「${actor.name}の　こうげき！」を表示
export type ShowAttackStartedText = {
  kind: "ShowAttackStartedText";
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

// 敵を倒した時の敵消去
export type EnemyHideByDefeat = {
  kind: "EnemyHideByDefeat";
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

// 「${actor.name}は　みをまもっている！」(敵/味方共通）
export type ShowSelfDefenceText = {
  kind: "ShowSelfDefenceText";
  actorId: ActorId;
};

// 「${actor.name}は　しんでしまった！」(味方）
export type ShowDeadText = {
  kind: "ShowDeadText";
  actorId: ActorId;
};

// 「${actor.name}を　たおした！」(敵）
export type ShowDefeatText = {
  kind: "ShowDefeatText";
  actorId: ActorId;
};

export type PresentationEffect = ApplyState
  | ClearMessageWindowText
  | ShowAttackStartedText
  | PlaySe
  | EnemyDamageBlink
  | EnemyHideByDefeat
  | ShowEnemyDamageText
  | PlayerDamageShake
  | ShowPlayerDamageText
  | ShowSelfDefenceText
  | ShowDeadText
  | ShowDefeatText;
