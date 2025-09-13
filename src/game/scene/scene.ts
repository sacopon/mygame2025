import { GameObject, GamePorts } from "@game/core";

export interface GameObjectAccess {
  spawnGameObject(gameObject: GameObject): void;
}

export interface SceneContext {
  ports: GamePorts;
  gameObjectAccess: GameObjectAccess;
}

export interface Scene {
  update(deltaTime: number): boolean;
  onExit?(): void;
  onEnter?(context: SceneContext): void;
  next(): SceneId;
}

export type SceneId = "Battle";
