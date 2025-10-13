import { Ally, AllyId } from "@game/domain";

const allyCharacters: Ally[] = [
  { allyId: AllyId(1), name: "ゆうしゃ" },  // 勇者
  { allyId: AllyId(2), name: "もりそば" },  // 武闘家
  { allyId: AllyId(3), name: "うおのめ" },  // 賢者
  { allyId: AllyId(4), name: "かおる"   },  // 戦士
] as const;

// TODO: AllyId が被ってないかを検証するメソッドを作成する(verifyAllyCharacters)

export const findAlly = (id: AllyId): Ally => {
  const ally = allyCharacters.find(a => a.allyId === id);

  if (!ally) {
    console.error(`Ally not found: ${id}`);
  }

  return ally!;
};
