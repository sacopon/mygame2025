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

// 最終行のクリア(次のメッセージで上書きのような形になる)
export type ClearLastText = {
  kind: "ClearLastText";
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

// 「会心の　いちげき！」(味方→敵）
export type ShowPlayerCriticalText = {
  kind: "ShowPlayerCriticalText";
};

// 「痛恨の　いちげき！」(敵→味方）
export type ShowEnemyCriticalText = {
  kind: "ShowEnemyCriticalText";
};

// 「ミス！」(敵/味方共通)
export type ShowMissText = {
  kind: "ShowMissText";
};

// 「${actor.name}にダメージを与えられない！」(敵/味方共通)
export type ShowNoDamageText = {
  kind: "ShowNoDamageText";
  actorId: ActorId;
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
  | ClearLastText
  | ShowAttackStartedText
  | PlaySe
  | EnemyDamageBlink
  | EnemyHideByDefeat
  | ShowEnemyDamageText
  | PlayerDamageShake
  | ShowPlayerDamageText
  | ShowMissText
  | ShowPlayerCriticalText
  | ShowEnemyCriticalText
  | ShowNoDamageText
  | ShowSelfDefenceText
  | ShowDeadText
  | ShowDefeatText;
