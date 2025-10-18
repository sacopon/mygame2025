import { DomainPorts } from "@game/domain";
import { GameObject, GamePorts } from "@game/presentation";

export interface GameObjectAccess {
  spawnGameObject<T extends GameObject>(o: T): T;
  despawnGameObject(o: GameObject): void;
}

export type UiPorts = GamePorts;
export interface SceneContext {
  ui: UiPorts;
  domain: DomainPorts;
  gameObjectAccess: GameObjectAccess;
}

export interface Scene {
  update(deltaTime: number): boolean;
  onExit?(): void;
  onEnter?(context: SceneContext): void;
  next(): SceneId;
}

export type SceneId = "Battle";
