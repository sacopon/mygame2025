import { Ally, AllyId } from "../../actor";

export interface AllyRepository {
  findAlly(id: AllyId): Ally;
};
