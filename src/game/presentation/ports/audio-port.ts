import { SeId } from "..";

export interface AudioPort {
  play(id: SeId): void;
  resumeIfSuspendedAsync(): void;
  dispose(): void;
}
