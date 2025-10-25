import { Ally, AllyId } from "@game/domain";

export interface AllyRepository {
  findAlly(id: AllyId): Ally;
};
