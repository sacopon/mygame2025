import { BgmId, SeId } from "..";

export interface AudioPort {
  playBgm(id: BgmId): void;
  playSe(id: SeId): void;
  dispose(): void;
}
