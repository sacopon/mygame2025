/** キャラクターのID(プレイヤー側として登場する全キャラクターでユニークなIDとする) */
export type ActorId = number;

/**
 * キャラクター定義
 */
export type Actor = {
  id: ActorId,
  name: string,
};

const actors = [
  { id: 1, name: "ゆうしゃ" },  // 勇者
  { id: 2, name: "もりそば" },  // 武闘家
  { id: 3, name: "うおのめ" },  // 賢者
  { id: 4, name: "かおる" },    // 戦士
] as const;

// TODO: アクターのIDが被ってないかを検証するメソッドを作成する(verifyActors)

export const findActor = (id: ActorId): Actor => {
  const actor = actors.find(a => a.id === id);

  if (!actor) {
    console.error(`指定されたIDのアクターが見つかりません[ID:${id}]`);
  }

  return actor!;
};
