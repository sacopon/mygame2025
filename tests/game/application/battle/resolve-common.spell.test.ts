import { ActionType, Spell, SpellId, SpellPlannedAction, SpellPower } from "@game/domain";
import { createStateAndDeps } from "./helpers/battle-test-utils";
import { resolveSpellTargets } from "@game/application/battle/resolve-common";

function makeSpell(id: number, scope: "single" | "group" | "all", side: "us" | "them", type: "damage" | "heal" = "damage"): Spell {
  const spellId = SpellId(id);
  return {
    spellId,
    name: `テストダメージ呪文${id}`,
    power: SpellPower.of(0),
    type,
    target: { scope, side, },
  };
}

describe("resolveSpellTargets side: them", () => {
  describe("resolveSpellTargets (ally single spell → enemy group)", () => {
    describe("明示的 targetId が指定されている場合", () => {
      test("targetId が生存していればそれを返す", () => {
        const { state, deps, allies, enemies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [
            { id: 10, groupId: 1 },
            { id: 11, groupId: 1 },
          ],
        });

        const caster = allies[0];
        const target = enemies[0];
        const spell = makeSpell(1, "single", "them");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // UI でグループ1を選択した想定
          selection: { kind: "group", groupId: target.enemyGroupId },
          // 計画フェーズで targetId まで指定されている場合を想定
          mode: { kind: "single", targetId: target.actorId },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([target.actorId]);
      });

      test("targetId が死亡していれば同一グループの生存者から返す", () => {
        const { state, deps, allies, enemies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [
            { id: 10, groupId: 1, hp: 0 },
            { id: 11, groupId: 2, },
            { id: 12, groupId: 1, },
          ],
        });

        const caster = allies[0];
        const target = enemies[0];
        const expected = enemies[2];
        const spell = makeSpell(1, "single", "them");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // UI でグループ1を選択した想定
          selection: { kind: "group", groupId: target.enemyGroupId },
          // 計画フェーズで targetId まで指定されている場合を想定
          mode: { kind: "single", targetId: target.actorId },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([expected.actorId]);
      });

      test("targetId が死亡していて同一グループに生存者が居ない場合は全体の生存者から返す", () => {
        const { state, deps, allies, enemies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [
            { id: 10, groupId: 1, hp: 0 },
            { id: 11, groupId: 1, hp: 0 },
            { id: 12, groupId: 2 },
          ],
        });

        const caster = allies[0];
        const target = enemies[0];
        const expected = enemies[2];
        const spell = makeSpell(1, "single", "them");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // UI でグループ1を選択した想定
          selection: { kind: "group", groupId: target.enemyGroupId },
          // 計画フェーズで targetId まで指定されている場合を想定
          mode: { kind: "single", targetId: target.actorId },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([expected.actorId]);
      });

      test("敵が全滅している場合は空配列を返す", () => {
        const { state, deps, allies, enemies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [
            { id: 10, groupId: 1, hp: 0 },
            { id: 11, groupId: 2, hp: 0 },
          ],
        });

        const caster = allies[0];
        const target = enemies[0];
        const spell = makeSpell(1, "single", "them");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // UI でグループ1を選択した想定
          selection: { kind: "group", groupId: target.enemyGroupId },
          // 計画フェーズで targetId まで指定されている場合を想定
          mode: { kind: "single", targetId: target.actorId },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([]);
      });
    });

    describe("明示的 targetId が指定されてない場合", () => {
      test("そのグループに生存者が居たらその中から選択される", () => {
        const { state, deps, allies, enemies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [
            { id: 10, groupId: 1, hp: 0 },
            { id: 11, groupId: 1 },
            { id: 12, groupId: 2 },
          ],
        });

        const caster = allies[0];
        const groupId = enemies[0].enemyGroupId;
        const expected = enemies[1];
        const spell = makeSpell(1, "single", "them");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // UI でグループ1を選択した想定
          selection: { kind: "group", groupId },
          mode: { kind: "single" },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([expected.actorId]);
      });

      test("そのグループが全滅していたら敵全体から選択される", () => {
        const { state, deps, allies, enemies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [
            // グループ1は全滅
            { id: 10, groupId: 1, hp: 0 },
            { id: 11, groupId: 1, hp: 0 },
            // グループ2は生存
            { id: 12, groupId: 2 },
            { id: 13, groupId: 2 },
          ],
        });

        const caster = allies[0];
        const groupId = enemies[0].enemyGroupId;
        const expected = enemies[2];
        const spell = makeSpell(1, "single", "them");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // UI でグループ1を選択した想定
          selection: { kind: "group", groupId },
          mode: { kind: "single" },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([expected.actorId]);
      });

      test("敵が全滅している場合は空配列を返す", () => {
        const { state, deps, allies, enemies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [
            { id: 10, groupId: 1, hp: 0 },
            { id: 11, groupId: 2, hp: 0 },
          ],
        });

        const caster = allies[0];
        const groupId = enemies[0].enemyGroupId;
        const spell = makeSpell(1, "single", "them");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // UI でグループ1を選択した想定
          selection: { kind: "group", groupId },
          mode: { kind: "single" },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([]);
      });
    });
  });

  describe("resolveSpellTargets (ally group spell → enemy group)", () => {
    test("そのグループの生存者全員が選択される", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [{ id: 1 }],
        enemies: [
          { id: 10, groupId: 1, hp: 0 },
          { id: 11, groupId: 1 },
          { id: 12, groupId: 1 },
          { id: 13, groupId: 2 },
        ],
      });

      const caster = allies[0];
      const groupId = enemies[0].enemyGroupId;
      const expected = [enemies[1], enemies[2]];
      const spell = makeSpell(1, "group", "them");

      const action: SpellPlannedAction = {
        actionType: ActionType.Spell,
        actorId: caster.actorId,
        spellId: spell.spellId,
        // UI でグループ1を選択した想定
        selection: { kind: "group", groupId },
        mode: { kind: "group", groupId },
      };

      const result = resolveSpellTargets(state, action, spell, deps);
      expect(result).toEqual(expected.map(e => e.actorId));
    });

    test("そのグループが全滅していたら別のグループの生存者全員が選択される", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [{ id: 1 }],
        enemies: [
          { id: 10, groupId: 1, hp: 0 },
          { id: 11, groupId: 1, hp: 0 },
          { id: 12, groupId: 2, hp: 0 },
          { id: 13, groupId: 3, hp: 0 },
          { id: 14, groupId: 3 },
          { id: 15, groupId: 3 },
        ],
      });

      const caster = allies[0];
      const groupId = enemies[0].enemyGroupId;
      const expected = [enemies[4], enemies[5]];
      const spell = makeSpell(1, "group", "them");

      const action: SpellPlannedAction = {
        actionType: ActionType.Spell,
        actorId: caster.actorId,
        spellId: spell.spellId,
        // UI でグループ1を選択した想定
        selection: { kind: "group", groupId },
        mode: { kind: "group", groupId },
      };

      const result = resolveSpellTargets(state, action, spell, deps);
      expect(result).toEqual(expected.map(e => e.actorId));
    });

    test("敵が全滅している場合は空配列を返す", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [{ id: 1 }],
        enemies: [
          { id: 10, groupId: 1, hp: 0 },
          { id: 12, groupId: 2, hp: 0 },
        ],
      });

      const caster = allies[0];
      const groupId = enemies[0].enemyGroupId;
      const spell = makeSpell(1, "group", "them");

      const action: SpellPlannedAction = {
        actionType: ActionType.Spell,
        actorId: caster.actorId,
        spellId: spell.spellId,
        // UI でグループ1を選択した想定
        selection: { kind: "group", groupId },
        mode: { kind: "group", groupId },
      };

      const result = resolveSpellTargets(state, action, spell, deps);
      expect(result).toEqual([]);
    });
  });

  describe("resolveSpellTargets (ally all spell → enemy all)", () => {
    test("敵の生存者全員が選択される", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [{ id: 1 }],
        enemies: [
          { id: 10, groupId: 1, hp: 0 },
          { id: 11, groupId: 2 },
        ],
      });

      const caster = allies[0];
      const expected = [enemies[1]];
      const spell = makeSpell(1, "all", "them");

      const action: SpellPlannedAction = {
        actionType: ActionType.Spell,
        actorId: caster.actorId,
        spellId: spell.spellId,
        // UI では何も選択しない
        selection: { kind: "none" },
        mode: { kind: "none" },
      };

      const result = resolveSpellTargets(state, action, spell, deps);
      expect(result).toEqual(expected.map(e => e.actorId));
    });

    test("敵が全滅している場合は空配列を返す", () => {
      const { state, deps, allies } = createStateAndDeps({
        allies: [{ id: 1 }],
        enemies: [
          { id: 10, groupId: 1, hp: 0 },
          { id: 12, groupId: 2, hp: 0 },
        ],
      });

      const caster = allies[0];
      const spell = makeSpell(1, "all", "them");

      const action: SpellPlannedAction = {
        actionType: ActionType.Spell,
        actorId: caster.actorId,
        spellId: spell.spellId,
        // UI では何も選択しない
        selection: { kind: "none" },
        mode: { kind: "none" },
      };

      const result = resolveSpellTargets(state, action, spell, deps);
      expect(result).toEqual([]);
    });
  });

  describe("resolveSpellTargets (enemy single spell → ally)", () => {
    describe("明示的 targetId が指定されている場合", () => {
      test("targetId が生存していればそれを返す", () => {
        const { state, deps, allies, enemies } = createStateAndDeps({
          allies: [
            { id: 1 },
            { id: 2 }
          ],
          enemies: [{ id: 10, groupId: 1 }],
        });

        const caster = enemies[0];
        const target = allies[0];
        const spell = makeSpell(1, "single", "them");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // 敵側なのでUI選択はなし
          selection: { kind: "none", },
          // 計画フェーズで targetId まで指定されている場合を想定
          mode: { kind: "single", targetId: target.actorId },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([target.actorId]);
      });

      test("targetId が死亡していれば全体の生存者から返す", () => {
        const { state, deps, allies, enemies } = createStateAndDeps({
          allies: [
            { id: 1, hp: 0 },
            { id: 2 }
          ],
          enemies: [{ id: 10, groupId: 1 }],
        });

        const caster = enemies[0];
        const target = allies[0];
        const expected = allies[1];
        const spell = makeSpell(1, "single", "them");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // 敵側なのでUI選択はなし
          selection: { kind: "none", },
          // 計画フェーズで targetId まで指定されている場合を想定
          mode: { kind: "single", targetId: target.actorId },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([expected.actorId]);
      });

      test("全滅している場合は空配列を返す", () => {
        const { state, deps, allies, enemies } = createStateAndDeps({
          allies: [
            { id: 1, hp: 0 },
            { id: 2, hp: 0 }
          ],
          enemies: [{ id: 10, groupId: 1 }],
        });

        const caster = enemies[0];
        const target = allies[0];
        const spell = makeSpell(1, "single", "them");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // 敵側なのでUI選択はなし
          selection: { kind: "none", },
          // 計画フェーズで targetId まで指定されている場合を想定
          mode: { kind: "single", targetId: target.actorId },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([]);
      });
    });

    describe("明示的 targetId が指定されてない場合", () => {
      test("生存者が居たらその中から選択される", () => {
        const { state, deps, allies, enemies } = createStateAndDeps({
          allies: [
            { id: 1, hp: 0 },
            { id: 2 }
          ],
          enemies: [{ id: 10, groupId: 1 }],
        });

        const caster = enemies[0];
        const expected = allies[1];
        const spell = makeSpell(1, "single", "them");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // 敵側なのでUI選択はなし
          selection: { kind: "none", },
          mode: { kind: "single" },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([expected.actorId]);
      });

      test("全滅している場合は空配列を返す", () => {
        const { state, deps, enemies } = createStateAndDeps({
          allies: [
            { id: 1, hp: 0 },
            { id: 2, hp: 0 }
          ],
          enemies: [{ id: 10, groupId: 1 }],
        });

        const caster = enemies[0];
        const spell = makeSpell(1, "single", "them");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // 敵側なのでUI選択はなし
          selection: { kind: "none", },
          mode: { kind: "single" },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([]);
      });
    });
  });

  describe("resolveSpellTargets (enemy group spell → ally all)", () => {
    test("プレイヤー側の生存者全員が選択される", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [
          { id: 1 },
          { id: 2, hp: 0 },
          { id: 3 },
        ],
        enemies: [{ id: 10, groupId: 1 }],
      });

      const caster = enemies[0];
      const expected = [allies[0], allies[2]];
      const spell = makeSpell(1, "group", "them");

      const action: SpellPlannedAction = {
        actionType: ActionType.Spell,
        actorId: caster.actorId,
        spellId: spell.spellId,
        // 敵側なのでUIなし
        selection: { kind: "none" },
        mode: { kind: "none" },
      };

      const result = resolveSpellTargets(state, action, spell, deps);
      expect(result).toEqual(expected.map(e => e.actorId));
    });

    test("プレイヤー側が全滅していたら空配列", () => {
      const { state, deps, enemies } = createStateAndDeps({
        allies: [
          { id: 1, hp: 0 },
          { id: 2, hp: 0 },
        ],
        enemies: [{ id: 10, groupId: 1 }],
      });

      const caster = enemies[0];
      const spell = makeSpell(1, "group", "them");

      const action: SpellPlannedAction = {
        actionType: ActionType.Spell,
        actorId: caster.actorId,
        spellId: spell.spellId,
        // 敵側なのでUIなし
        selection: { kind: "none" },
        mode: { kind: "none" },
      };

      const result = resolveSpellTargets(state, action, spell, deps);
      expect(result).toEqual([]);
    });
  });

  describe("resolveSpellTargets (enemy all spell → ally all)", () => {
    test("プレイヤー側の生存者全員が選択される", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [
          { id: 1 },
          { id: 2, hp: 0 },
          { id: 3 },
        ],
        enemies: [{ id: 10, groupId: 1 }],
      });

      const caster = enemies[0];
      const expected = [allies[0], allies[2]];
      const spell = makeSpell(1, "all", "them");

      const action: SpellPlannedAction = {
        actionType: ActionType.Spell,
        actorId: caster.actorId,
        spellId: spell.spellId,
        // 敵側なのでUIなし
        selection: { kind: "none" },
        mode: { kind: "none" },
      };

      const result = resolveSpellTargets(state, action, spell, deps);
      expect(result).toEqual(expected.map(e => e.actorId));
    });

    test("プレイヤー側が全滅していたら空配列", () => {
      const { state, deps, enemies } = createStateAndDeps({
        allies: [
          { id: 1, hp: 0 },
          { id: 2, hp: 0 },
        ],
        enemies: [{ id: 10, groupId: 1 }],
      });

      const caster = enemies[0];
      const spell = makeSpell(1, "all", "them");

      const action: SpellPlannedAction = {
        actionType: ActionType.Spell,
        actorId: caster.actorId,
        spellId: spell.spellId,
        // 敵側なのでUIなし
        selection: { kind: "none" },
        mode: { kind: "none" },
      };

      const result = resolveSpellTargets(state, action, spell, deps);
      expect(result).toEqual([]);
    });
  });
});

describe("resolveSpellTargets side: us", () => {
  describe("resolveSpellTargets (ally single spell → ally single)", () => {
    describe("明示的 targetId が指定されている場合", () => {
      test("targetId が生存していればそれを返す", () => {
        const { state, deps, allies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [{ id: 10, groupId: 1 }],
        });

        const caster = allies[0];
        const target = allies[0];
        const spell = makeSpell(1, "single", "us", "heal");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // UI で対象を選択した想定
          selection: { kind: "ally", actorId: target.actorId },
          mode: { kind: "single", targetId: target.actorId },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([target.actorId]);
      });

      test("targetId が死亡していれば他の生存者から返す", () => {
        const { state, deps, allies } = createStateAndDeps({
          allies: [
            { id: 1 },
            { id: 2, hp: 0 },
          ],
          enemies: [{ id: 10, groupId: 1 }],
        });

        const caster = allies[0];
        const target = allies[1];
        const expected = allies[0];
        const spell = makeSpell(1, "single", "us", "heal");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // UI で対象を選択した想定
          selection: { kind: "ally", actorId: target.actorId },
          mode: { kind: "single", targetId: target.actorId },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([expected.actorId]);
      });

      test("全滅している場合は空配列を返す(casterが死亡していることはないはずだが一応)", () => {
        const { state, deps, allies } = createStateAndDeps({
          allies: [
            { id: 1, hp: 0 },
            { id: 2, hp: 0 },
          ],
          enemies: [{ id: 10, groupId: 1 }],
        });

        const caster = allies[0];
        const target = allies[1];
        const spell = makeSpell(1, "single", "us", "heal");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // UI で対象を選択した想定
          selection: { kind: "ally", actorId: target.actorId },
          mode: { kind: "single", targetId: target.actorId },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([]);
      });
    });

    describe("明示的 targetId が指定されてない場合", () => {
      test("UIで選択された対象が生存していればそれを返す", () => {
        const { state, deps, allies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [{ id: 10, groupId: 1 }],
        });

        const caster = allies[0];
        const target = allies[0];
        const spell = makeSpell(1, "single", "us", "heal");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // UI で対象を選択した想定
          selection: { kind: "ally", actorId: target.actorId },
          mode: { kind: "single" },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([target.actorId]);
      });

      test("UIで選択された対象が死亡していれば他の生存者から返す", () => {
        const { state, deps, allies } = createStateAndDeps({
          allies: [
            { id: 1 },
            { id: 2, hp: 0 },
          ],
          enemies: [{ id: 10, groupId: 1 }],
        });

        const caster = allies[0];
        const target = allies[1];
        const expected = allies[0];
        const spell = makeSpell(1, "single", "us", "heal");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // UI で対象を選択した想定
          selection: { kind: "ally", actorId: target.actorId },
          mode: { kind: "single" },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([expected.actorId]);
      });

      test("全滅している場合は空配列を返す(casterが死亡していることはないはずだが一応)", () => {
        const { state, deps, allies } = createStateAndDeps({
          allies: [
            { id: 1, hp: 0 },
            { id: 2, hp: 0 },
          ],
          enemies: [{ id: 10, groupId: 1 }],
        });

        const caster = allies[0];
        const target = allies[1];
        const spell = makeSpell(1, "single", "us", "heal");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // UI で対象を選択した想定
          selection: { kind: "ally", actorId: target.actorId },
          mode: { kind: "single" },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([]);
      });
    });
  });

  describe("resolveSpellTargets (ally all spell → ally all)", () => {
    test("生存者だけを返す", () => {
      const { state, deps, allies } = createStateAndDeps({
        allies: [
          { id: 1 },
          { id: 2, hp: 0 },
          { id: 3 },
        ],
        enemies: [{ id: 10, groupId: 1 }],
      });

      const caster = allies[0];
      const expected = [allies[0], allies[2]];
      const spell = makeSpell(1, "all", "us", "heal");

      const action: SpellPlannedAction = {
        actionType: ActionType.Spell,
        actorId: caster.actorId,
        spellId: spell.spellId,
        selection: { kind: "none" },
        mode: { kind: "none" },
      };

      const result = resolveSpellTargets(state, action, spell, deps);
      expect(result).toEqual(expected.map(e => e.actorId));
    });

    test("全滅している場合は空配列を返す(casterが死亡していることはないはずだが一応)", () => {
      const { state, deps, allies } = createStateAndDeps({
        allies: [
          { id: 1, hp: 0 },
          { id: 2, hp: 0 },
        ],
        enemies: [{ id: 10, groupId: 1 }],
      });

      const caster = allies[0];
      const spell = makeSpell(1, "all", "us", "heal");

      const action: SpellPlannedAction = {
        actionType: ActionType.Spell,
        actorId: caster.actorId,
        spellId: spell.spellId,
        selection: { kind: "none" },
        mode: { kind: "none" },
      };

      const result = resolveSpellTargets(state, action, spell, deps);
      expect(result).toEqual([]);
    });
  });

  describe("resolveSpellTargets (enemy single spell → enemy single)", () => {
    describe("明示的 targetId が指定されている場合", () => {
      test("targetId が生存していればそれを返す", () => {
        const { state, deps, enemies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [{ id: 10, groupId: 1 }],
        });

        const caster = enemies[0];
        const target = enemies[0];
        const spell = makeSpell(1, "single", "us", "heal");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // 敵はUIから選択しない
          selection: { kind: "none" },
          mode: { kind: "single", targetId: target.actorId },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([target.actorId]);
      });

      test("targetId が死亡していれば他の生存者から返す", () => {
        const { state, deps, enemies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [
            { id: 10, groupId: 1 },
            { id: 11, groupId: 2, hp: 0 },
          ],
        });

        const caster = enemies[0];
        const target = enemies[1];
        const expected = enemies[0];
        const spell = makeSpell(1, "single", "us", "heal");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // 敵はUIから選択しない
          selection: { kind: "none" },
          mode: { kind: "single", targetId: target.actorId },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([expected.actorId]);
      });

      test("全滅している場合は空配列を返す(casterが死亡していることはないはずだが一応)", () => {
        const { state, deps, enemies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [{ id: 10, groupId: 1, hp: 0 }],
        });

        const caster = enemies[0];
        const target = enemies[0];
        const spell = makeSpell(1, "single", "us", "heal");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // 敵はUIから選択しない
          selection: { kind: "none" },
          mode: { kind: "single", targetId: target.actorId },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([]);
      });
    });

    describe("明示的 targetId が指定されいない場合", () => {
      test("生存者の中から返す", () => {
        const { state, deps, enemies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [
            { id: 10, groupId: 1 },
            { id: 11, groupId: 2, hp: 0 },
            { id: 12, groupId: 3 },
          ],
        });

        const caster = enemies[2];
        const expected = enemies[0];
        const spell = makeSpell(1, "single", "us", "heal");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // 敵はUIから選択しない
          selection: { kind: "none" },
          mode: { kind: "single" },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([expected.actorId]);
      });

      test("全滅している場合は空配列を返す(casterが死亡していることはないはずだが一応)", () => {
        const { state, deps, enemies } = createStateAndDeps({
          allies: [{ id: 1 }],
          enemies: [{ id: 10, groupId: 1, hp: 0 }],
        });

        const caster = enemies[0];
        const spell = makeSpell(1, "single", "us", "heal");

        const action: SpellPlannedAction = {
          actionType: ActionType.Spell,
          actorId: caster.actorId,
          spellId: spell.spellId,
          // 敵はUIから選択しない
          selection: { kind: "none" },
          mode: { kind: "single" },
        };

        const result = resolveSpellTargets(state, action, spell, deps);
        expect(result).toEqual([]);
      });
    });
  });

  describe("resolveSpellTargets (enemy all spell → enemy all)", () => {
    test("生存者の中から返す", () => {
      const { state, deps, enemies } = createStateAndDeps({
        allies: [{ id: 1 }],
        enemies: [
          { id: 10, groupId: 1 },
          { id: 11, groupId: 2, hp: 0 },
          { id: 12, groupId: 3 },
        ],
      });

      const caster = enemies[0];
      const expected = [enemies[0], enemies[2]];
      const spell = makeSpell(1, "all", "us", "heal");

      const action: SpellPlannedAction = {
        actionType: ActionType.Spell,
        actorId: caster.actorId,
        spellId: spell.spellId,
        // 敵はUIから選択しない
        selection: { kind: "none" },
        mode: { kind: "none" },
      };

      const result = resolveSpellTargets(state, action, spell, deps);
      expect(result).toEqual(expected.map(e => e.actorId));
    });

    test("全滅している場合は空配列を返す(casterが死亡していることはないはずだが一応)", () => {
      const { state, deps, enemies } = createStateAndDeps({
        allies: [{ id: 1 }],
        enemies: [{ id: 10, groupId: 1, hp: 0 }],
      });

      const caster = enemies[0];
      const spell = makeSpell(1, "all", "us", "heal");

      const action: SpellPlannedAction = {
        actionType: ActionType.Spell,
        actorId: caster.actorId,
        spellId: spell.spellId,
        // 敵はUIから選択しない
        selection: { kind: "none" },
        mode: { kind: "none" },
      };

      const result = resolveSpellTargets(state, action, spell, deps);
      expect(result).toEqual([]);
    });
  });
});
