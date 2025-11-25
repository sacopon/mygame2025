import { Actor, ActorId, EnemyGroupId, Spell, SpellId } from "@game/domain";
import { RandomPort } from "@game/presentation";

/**
 * 各種判定ロジックをまとめたもの
 */
export type ResolveDeps = {
  random: RandomPort;
  getActor: (id: ActorId) => Actor;
  getSpell: (id: SpellId) => Spell;
  isAlly: (id: ActorId) => boolean;
  getActorIdsByEnemyGroup: (groupId: EnemyGroupId) => ReadonlyArray<ActorId>;
  enemyGroupIds: ReadonlyArray<EnemyGroupId>;
};
