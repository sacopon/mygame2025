import { SeId } from "..";

export interface AudioPort {
  play(id: SeId): void;
  resumeIfSuspended(): void;
  dispose(): void;
}
