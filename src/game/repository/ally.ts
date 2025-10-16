import { AllyRepository } from "../domain/ports/repositories/ally-repository";
import { Ally, AllyId } from "@game/domain";

// TODO: AllyId が被ってないかを検証するメソッドを作成する(verifyAllyCharacters)
export class AllyRepositoryInMemory implements AllyRepository {
  #data: ReadonlyArray<Ally>;

  constructor(data: ReadonlyArray<Ally>) {
    this.#data = data;
  }

  findAlly(id: AllyId): Ally {
    const ally = this.#data.find(a => a.allyId === id);

    if (!ally) {
      console.error(`Ally not found: ${id}`);
    }

    return ally!;
  }
};
