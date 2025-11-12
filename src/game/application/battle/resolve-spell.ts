import { ActorId, BattleDomainState, DamageApplied, HealApplied, SpellPlannedAction, TurnSnapshot } from "@game/domain";
import { ResolveDeps } from "./resolve-types";
import { PresentationEffect } from "..";
import { createEffectsFromDamageApplied, createEffectsFromRecoverApplied, resolveSpellTargets } from "./resolve-common";

/**
 * actionType: Spell の行動について、DomainEvent と PresentationEffect に解決する
 *
 * @param action 行動内容(actionType: Spell)
 * @returns 最新の state と、演出用 effects
 */
export function createSpellResolution(currentState: Readonly<BattleDomainState>, turn: Readonly<TurnSnapshot>, action: Readonly<SpellPlannedAction>, deps: ResolveDeps)
  : {
    state: Readonly<BattleDomainState>,
    effects: ReadonlyArray<PresentationEffect>,
  } {
  let nextState: Readonly<BattleDomainState> = currentState;
  const resultEffects: PresentationEffect[] = [];
  const spell = deps.getSpell(action.spellId);
  const targets = resolveSpellTargets(currentState, action, spell, deps);

  // 呪文ヘッダ共通部分
  resultEffects.push(
    { kind: "ClearMessageWindowText" },
    { kind: "PlaySe", seId: "spell" },
    { kind: "ShowCastSpellText", actorId: action.actorId, spellId: action.spellId },
  );

  switch (spell.type) {
    case "damage": {
        const { state, effects } = createDamageSpellResolutions(nextState, turn, action.actorId, targets, deps);
        nextState = state;
        resultEffects.push(...effects);
      }
      break;

    case "heal": {
        const { state, effects } = createHealSpellResolutions(nextState, turn, action.actorId, targets, deps);
        nextState = state;
        resultEffects.push(...effects);
      }
      break;

    default:
      // assertNever(spell.type);
  }

  return { state: nextState, effects: resultEffects };
}

/**
 * actionType: Spell, type: "damage" の行動について、各対象分解決してまとめる
 *
 * @param action 行動内容(actionType: Spell)
 * @returns 最新の state と、演出用 effects
 */
function createDamageSpellResolutions(currentState: Readonly<BattleDomainState>, turn: Readonly<TurnSnapshot>, sourceId: ActorId, targets: ReadonlyArray<ActorId>, deps: ResolveDeps)
  : {
    state: Readonly<BattleDomainState>,
    effects: ReadonlyArray<PresentationEffect>,
  } {
  let nextState: Readonly<BattleDomainState> = currentState;
  const resultEffects: PresentationEffect[] = [];

  targets.forEach((targetId, index) => {
    // 2体目以降なら呪文を唱えたメッセージより先を消去
    if (0 < index) {
      resultEffects.push({ kind: "ClearMessageWindowExceptFirst" });
    }

    const { state, effects } = createDamageSpellResolutionSingle(nextState, turn, sourceId, targetId, deps);
    nextState = state;
    resultEffects.push(...effects);
  });

  return { state: nextState, effects: resultEffects };
}

/**
 * actionType: Spell, type: "damage" の行動について、DomainEvent と PresentationEffect に解決する
 *
 * @param action 行動内容(actionType: Spell)
 * @returns 最新の state と、演出用 effects
 */
function createDamageSpellResolutionSingle(currentState: Readonly<BattleDomainState>, turn: Readonly<TurnSnapshot>, sourceId: ActorId, targetId: ActorId, deps: ResolveDeps)
  : {
    state: Readonly<BattleDomainState>,
    effects: ReadonlyArray<PresentationEffect>,
  } {
  const effects: PresentationEffect[] = [];

  // 基礎ダメージ計算
  const baseDamage = 10;

  // ブレ(一律+-10%固定)
  // TODO: 器用さが高いとブレが少ない、とかにするか？
  const varianceRatio = 0.9 + deps.random.range(0, 20) / 100; // 0.9〜1.1
  const amount = Math.floor(baseDamage * varianceRatio);

  const event: DamageApplied = {
    type: "DamageApplied",
    sourceId,
    targetId,
    amount,
    critical: false,
  };

  currentState = currentState.apply(event);
  effects.push(...createEffectsFromDamageApplied(currentState, event, deps));

  return { state: currentState.clone(), effects };
}

/**
 * actionType: Spell, type: "recover" の行動について、各対象分解決してまとめる
 *
 * @param action 行動内容(actionType: Spell)
 * @returns 最新の state と、演出用 effects
 */
function createHealSpellResolutions(currentState: Readonly<BattleDomainState>, turn: Readonly<TurnSnapshot>, sourceId: ActorId, targets: ReadonlyArray<ActorId>, deps: ResolveDeps)
  : {
    state: Readonly<BattleDomainState>,
    effects: ReadonlyArray<PresentationEffect>,
  } {
  let nextState: Readonly<BattleDomainState> = currentState;
  const resultEffects: PresentationEffect[] = [];

  targets.forEach((targetId, index) => {
    // 2体目以降なら呪文を唱えたメッセージより先を消去
    if (0 < index) {
      resultEffects.push({ kind: "ClearMessageWindowExceptFirst" });
    }

    const { state, effects } = createHealSpellResolutionSingle(nextState, turn, sourceId, targetId, deps);
    nextState = state;
    resultEffects.push(...effects);
  });

  return { state: nextState, effects: resultEffects };
}

/**
 * actionType: Spell, type: "recover" の行動について、DomainEvent と PresentationEffect に解決する
 *
 * @param action 行動内容(actionType: Spell)
 * @returns 最新の state と、演出用 effects
 */
function createHealSpellResolutionSingle(currentState: Readonly<BattleDomainState>, turn: Readonly<TurnSnapshot>, sourceId: ActorId, targetId: ActorId, deps: ResolveDeps)
  : {
    state: Readonly<BattleDomainState>,
    effects: ReadonlyArray<PresentationEffect>,
  } {

  // 対象が死んでいる場合は何もしない
  if (currentState.isDead(targetId)) {
    return { state: currentState.clone(), effects: [] };
  }

  const effects: PresentationEffect[] = [];

  // 基礎回復量計算
  const baseRecover = 10;

  // ブレ(一律+-10%固定)
  // TODO: 器用さが高いとブレが少ない、とかにするか？
  const varianceRatio = 0.9 + deps.random.range(0, 20) / 100; // 0.9〜1.1
  const amount = Math.floor(baseRecover * varianceRatio);

  const event: HealApplied = {
    type: "HealApplied",
    sourceId,
    targetId,
    amount,
  };

  currentState = currentState.apply(event);
  effects.push(...createEffectsFromRecoverApplied(currentState, event));

  return { state: currentState.clone(), effects };
}
