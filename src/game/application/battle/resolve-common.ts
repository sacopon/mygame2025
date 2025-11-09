import { ActorId, BattleDomainState, DamageApplied, HealApplied, SpellPlannedAction, Spell, AttackPlannedAction, EnemyGroupId } from "@game/domain";
import { ResolveDeps } from "./resolve-types";
import { PresentationEffect } from "..";
import { assertNever } from "@shared";

/**
 * Attack の内容から、実際のターゲットを決定する
 *
 * @param action 行動内容
 * @returns 決定された具体的な対象(配列)、1体の場合でも配列で戻す
 */
export function resolveAttackTargets(state: Readonly<BattleDomainState>, action: Readonly<AttackPlannedAction>, deps: ResolveDeps): ReadonlyArray<ActorId> {
  switch (action.mode.kind) {
    case "single": {
      // すでに決まっていたらその内容で確定する
      if (action.mode.targetId) {
        if (state.isAlive(action.mode.targetId)) {
          // 生きていればそれで確定
          return [ action.mode.targetId ];
        }
        else if (deps.isAlly(action.actorId)) {
          // 味方の攻撃、生存している敵をひとり選択
          const list = state.getAliveEnemyActorIds();
          return 0 < list.length ? [deps.random.choice(list)] : [];
        }
        else {
          // 敵の攻撃、生存している味方をひとり選択
          const list = state.getAliveAllyActorIds();
          return 0 < list.length ? [deps.random.choice(list)] : [];
        }
      }

      if (action.selection.kind === "group") {
        // グループ選択 で 対象は1人(= 味方の行動であることが型から確定している)
        const list = deps
          .getActorIdsByEnemyGroup(action.selection.groupId)
          .filter(id => state.isAlive(id));

        if (0 < list.length) {
          // グループ内に生存者がいればその中からランダム
          return [deps.random.choice(list)];
        }
        else {
          // そのグループが全滅している
          const list = state.getAliveEnemyActorIds();
          // 全体からランダム、全体がそもそも全滅している場合は空の配列
          return 0 < list.length ? [deps.random.choice(list)] : [];
        }
      }
      else {
        // 敵の場合
        const allies = state.getAliveAllyActorIds();
        return 0 < allies.length ? [deps.random.choice(allies)] : [];
      }
    }

    case "group": {
      // グループ攻撃は味方のみ
      const list = deps
        .getActorIdsByEnemyGroup(action.mode.groupId)
        .filter(id => state.isAlive(id));

      if (0 < list.length) {
        // グループ内に生存者がいればその生存者たち
        return list;
      }

      // そのグループが全滅している場合は別のグループを選択
      const anotherEnemyGroupsId = pickAlternativeEnemyGroup(state, deps, action.mode.groupId);

      // 敵全滅
      if (!anotherEnemyGroupsId) {
        return [];
      }

      return deps.getActorIdsByEnemyGroup(anotherEnemyGroupsId)
        .filter(id => state.isAlive(id));
    }

    case "all":
      return deps.isAlly(action.actorId) ? deps.aliveAllEnemies() : deps.aliveAllAllies();

    case "none":
      return [];

    default:
      return assertNever(action.mode);
  }
}

/**
 * Spell の内容から、実際のターゲットを決定する
 *
 * @param action 行動内容
 * @returns 決定された具体的な対象(配列)、1体の場合でも配列で戻す
 */
export function resolveSpellTargets(
  state: Readonly<BattleDomainState>,
  action: Readonly<SpellPlannedAction>,
  spell: Readonly<Spell>,
  deps: ResolveDeps
): ReadonlyArray<ActorId> {
  const isAllyCaster = deps.isAlly(action.actorId);
  const isTargetAllies = spell.target.side === "us" ? isAllyCaster : !isAllyCaster;

  switch (spell.target.kind) {
    case "all":
      // 敵(or味方)全体が対象の呪文
      // 指定サイドの生き残り全員が対象
      return isTargetAllies ? deps.aliveAllAllies() : deps.aliveAllEnemies();

    case "single": {
      // action.mode.kind も必然的に "single" となる
      if (action.mode.kind !== "single") {
        throw new Error("single-scope spell must have mode.kind === 'single'");
      }

      // 敵(or味方)単体が対象の呪文
      // 指定ターゲット優先
      if (action.mode.targetId) {
        // 生きていればそれで確定
        if (state.isAlive(action.mode.targetId)) {
          return [action.mode.targetId];
        }
      }

      // 指定がない、またはターゲットが死んでいる場合は side に応じてランダム
      const candidates = isTargetAllies
        ? state.getAliveAllyActorIds()
        : state.getAliveEnemyActorIds();

      return 0 < candidates.length ? [deps.random.choice(candidates)] : [];
    }

    case "group": {
      // 敵(or味方)グループが対象の呪文、敵側が使う場合は味方全体
      if (action.selection.kind === "group") {
        // UI選択もグループ = 味方側が使用する場合
        const list = deps
          .getActorIdsByEnemyGroup(action.selection.groupId)
          .filter(id => state.isAlive(id));

        if (0 < list.length) {
          // グループ内に生存者がいればその生存者たち
          return list;
        }
        else {
          // そのグループが全滅している場合は別のグループを選択
          const anotherEnemyGroupsId = pickAlternativeEnemyGroup(state, deps, action.selection.groupId);

          // 敵全滅
          if (!anotherEnemyGroupsId) {
            return [];
          }

          return deps.getActorIdsByEnemyGroup(anotherEnemyGroupsId)
            .filter(id => state.isAlive(id));
        }
      }
      else {
        // 敵側の場合
        return state.getAliveAllyActorIds();
      }
    }

    default:
      return assertNever(spell.target.kind);
  }
}

/**
 * ドメインイベント DamageApplied に対応した PresentationEffect を生成する
 *
 * @param event DamageApplied イベントの内容
 * @returns PresentationEffect の配列
 */
export function createEffectsFromDamageApplied(appliedState: Readonly<BattleDomainState>, event: DamageApplied, deps: ResolveDeps): ReadonlyArray<PresentationEffect> {
  const isPlayerAttack = deps.isAlly(event.sourceId);
  const isNoDamage = event.amount === 0;
  const effects: PresentationEffect[] = [];

  // ノーダメージ時
  if (isNoDamage) {
    effects.push(
      // SE再生
      { kind: "PlaySe", seId: "miss" },
      // 「ミス！
      //   ${actorId}に　ダメージを　与えられない！」
      { kind: "ShowMissText" },
      { kind: "ShowNoDamageText", actorId: event.targetId },
    );

    // ダメージ後の状態を適用
    effects.push({ kind: "ApplyState", state: appliedState });
    return effects;
  }

  // 会心/痛恨の一撃
  if (event.critical) {
    effects.push(
      // SE
      { kind: "PlaySe", seId: "critical" },
      // ウェイト
      // メッセージ（会心の一撃）
      // 「会心の　いちげき！」or「痛恨の　いちげき！」
      { kind: isPlayerAttack ? "ShowPlayerCriticalText" : "ShowEnemyCriticalText" },
    );
  }

  effects.push(
    // ダメージ後の状態を適用
    { kind: "ApplyState", state: appliedState },
  );

  if (isPlayerAttack) {
    effects.push(
      // SE再生
      { kind: "PlaySe", seId: "enemy_damage" },
      // 「${actorId}は　${amount}の　ダメージ！
      { kind: "ShowEnemyDamageText", actorId: event.targetId, amount: event.amount },
      // ダメージを受けた敵の点滅
      { kind: "EnemyDamageBlink", actorId: event.targetId },
    );

    if (appliedState.isDead(event.targetId)) {
      // 敵消去
      effects.push({ kind: "EnemyHideByDefeat", actorId: event.targetId });
      // (もしウィンドウいっぱいなら)最終行消去
      effects.push({ kind: "ClearLastText" });
      // 「${actor.name}を　たおした！」
      effects.push({ kind: "ShowDefeatText", actorId: event.targetId });
    }
  }
  else {
    effects.push(
      // SE再生
      { kind: "PlaySe", seId: "player_damage" },
      // 「${actor.name}は　${amount}の　ダメージを　うけた！」
      { kind: "ShowPlayerDamageText", actorId: event.targetId, amount: event.amount },
      // 画面の揺れ
      { kind: "PlayerDamageShake", actorId: event.targetId },
    );

    if (appliedState.isDead(event.targetId)) {
      // (もしウィンドウいっぱいなら)最終行消去
      effects.push({ kind: "ClearLastText" });
      // 「${actor.name}は　しんでしまった！」
      effects.push({ kind: "ShowDeadText", actorId: event.targetId });
    }
  }

  return effects;
}

/**
 * ドメインイベント RecoverApplied に対応した PresentationEffect を生成する
 *
 * @param event RecoverApplied イベントの内容
 * @returns PresentationEffect の配列
 */
export function createEffectsFromRecoverApplied(appliedState: Readonly<BattleDomainState>, event: HealApplied): ReadonlyArray<PresentationEffect> {
  const effects: PresentationEffect[] = [];

  effects.push(
    // 回復後の状態を適用
    { kind: "ApplyState", state: appliedState },
  );

  effects.push(
    // SE再生
    { kind: "PlaySe", seId: "heal" },
    // 「${actorId}の　キズが　回復した！
    { kind: "ShowHealText", actorId: event.targetId },
  );

  return effects;
}

/**
 * 生存者がいる別の敵グループを取得する
 * 生存者がいる別の敵グループが存在しない場合は null.
 */
function pickAlternativeEnemyGroup(
  state: Readonly<BattleDomainState>,
  deps: ResolveDeps,
  excludeGroupId?: EnemyGroupId,
): EnemyGroupId | null {
  const candidates = deps.enemyGroupIds.filter(groupId => {
    if (groupId === excludeGroupId) return false;

    const members = deps.getActorIdsByEnemyGroup(groupId);
    return members.some(id => state.isAlive(id));
  });

  if (candidates.length === 0) {
    return null;
  }

  return deps.random.choice(candidates);
}
