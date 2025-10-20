import { SeId } from "..";

export interface AudioPort {
  preloadAsync(source: Partial<Record<SeId, string>>): Promise<void>;
  play(id: SeId): void;
  resumeIfSuspendedAsync(): Promise<void>;
  dispose(): void;
}
