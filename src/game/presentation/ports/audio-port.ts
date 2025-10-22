import { SeId } from "..";

export interface AudioPort {
  play(id: SeId): void;
  resumeIfSuspendedAsync(): Promise<void>;
  dispose(): void;
}
