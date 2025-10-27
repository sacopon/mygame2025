import { EncounterEntry, EncounterTable } from "../models";

export function pickEncountTable(encountTable: Readonly<EncounterTable>, randomValue: number): EncounterEntry {
  const index = randomValue % encountTable.length;
  return encountTable[index];
}
