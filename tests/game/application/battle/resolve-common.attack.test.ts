import { ActionType, AttackPlannedAction } from "@game/domain";
import { createStateAndDeps } from "./helpers/battle-test-utils";
import { resolveAttackTargets } from "@game/application/battle/resolve-common";

describe("resolveAttackTargets (ally single attack → enemy group)", () => {
  describe("明示的 targetId が指定されている場合", () => {
    test("targetId が生存していればそれを返す", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [{ id: 1 }],
        enemies: [
          { id: 10, groupId: 1 },
          { id: 11, groupId: 1 },
        ],
      });

      const attacker = allies[0];
      const target = enemies[0];

      const action: AttackPlannedAction = {
        actionType: ActionType.Attack,
        actorId: attacker.actorId,
        // UI でグループ1を選択した想定
        selection: { kind: "group", groupId: target.enemyGroupId },
        mode: { kind: "single", targetId: target.actorId },
      };

      const result = resolveAttackTargets(state, action, deps);
      expect(result).toEqual([target.actorId]);
    });

    test("targetId が死亡していれば同一グループの生存者から返す", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [{ id: 1 }],
        enemies: [
          { id: 12, groupId: 2 },
          { id: 10, groupId: 1, hp: 0 },  // 死亡している状態
          { id: 11, groupId: 1 },
        ],
      });

      const attacker = allies[0];
      const target = enemies[1];    // 死亡しているターゲットが選択された状態
      const expected = enemies[2];  // 死亡しているので代替として選ばれるはずの敵

      const action: AttackPlannedAction = {
        actionType: ActionType.Attack,
        actorId: attacker.actorId,
        // UI でグループ1を選択した想定
        selection: { kind: "group", groupId: target.enemyGroupId },
        mode: { kind: "single", targetId: target.actorId },
      };

      const result = resolveAttackTargets(state, action, deps);
      expect(result).toEqual([expected.actorId]);
    });

    test("targetId が死亡していて同一グループに生存者が居ない場合は全体の生存者から返す", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [{ id: 1 }],
        enemies: [
          { id: 10, groupId: 1, hp: 0 },  // 死亡している状態
          { id: 11, groupId: 1, hp: 0 },  // 死亡している状態
          { id: 12, groupId: 2 },
        ],
      });

      const attacker = allies[0];
      const target = enemies[0];    // 死亡しているターゲットが選択された状態
      const expected = enemies[2];  // 死亡しているので代替として選ばれるはずの敵

      const action: AttackPlannedAction = {
        actionType: ActionType.Attack,
        actorId: attacker.actorId,
        // UI でグループ1を選択した想定
        selection: { kind: "group", groupId: target.enemyGroupId },
        mode: { kind: "single", targetId: target.actorId },
      };

      const result = resolveAttackTargets(state, action, deps);
      expect(result).toEqual([expected.actorId]);
    });

    test("敵が全滅している場合は空配列が返る", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [{ id: 1 }],
        enemies: [
          // 敵は全員死亡
          { id: 10, groupId: 1, hp: 0 },
          { id: 11, groupId: 1, hp: 0 },
          { id: 12, groupId: 2, hp: 0 },
        ],
      });

      const attacker = allies[0];
      const target = enemies[0];    // 死亡しているターゲットが選択された状態

      const action: AttackPlannedAction = {
        actionType: ActionType.Attack,
        actorId: attacker.actorId,
        // UI でグループ1を選択した想定
        selection: { kind: "group", groupId: target.enemyGroupId },
        mode: { kind: "single", targetId: target.actorId },
      };

      const result = resolveAttackTargets(state, action, deps);
      expect(result).toEqual([]);
    });
  });

  describe("明示的 targetId が指定されていない場合", () => {
    test("そのグループに生存者が居たらその中から選択される", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [{ id: 1 }],
        enemies: [
          { id: 10, groupId: 1, hp: 0 },
          { id: 11, groupId: 1 },
          { id: 12, groupId: 2 },
        ],
      });

      const attacker = allies[0];
      const groupId = enemies[0].enemyGroupId;
      const expected = enemies[1];

      const action: AttackPlannedAction = {
        actionType: ActionType.Attack,
        actorId: attacker.actorId,
        // UI でグループ1を選択した想定
        selection: { kind: "group", groupId },
        mode: { kind: "single" },
      };

      const result = resolveAttackTargets(state, action, deps);
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

      const attacker = allies[0];
      const groupId = enemies[0].enemyGroupId;  // グループが全滅しているところが選択されている想定
      const expected = enemies[2];

      const action: AttackPlannedAction = {
        actionType: ActionType.Attack,
        actorId: attacker.actorId,
        // UI でグループ1を選択した想定
        selection: { kind: "group", groupId },
        mode: { kind: "single" },
      };

      const result = resolveAttackTargets(state, action, deps);
      expect(result).toEqual([expected.actorId]);
    });

    test("敵が全滅していたら空配列が返る", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [{ id: 1 }],
        enemies: [
          { id: 10, groupId: 1, hp: 0 },
          { id: 11, groupId: 2, hp: 0 },
        ],
      });

      const attacker = allies[0];
      const groupId = enemies[0].enemyGroupId;

      const action: AttackPlannedAction = {
        actionType: ActionType.Attack,
        actorId: attacker.actorId,
        // UI でグループ1を選択した想定
        selection: { kind: "group", groupId },
        mode: { kind: "single" },
      };

      const result = resolveAttackTargets(state, action, deps);
      expect(result).toEqual([]);
    });
  });
});

describe("resolveAttackTargets (ally group attack → enemy group)", () => {
  test("グループに属する「生存している」敵のみ返す", () => {
    const { state, deps, allies, enemies } = createStateAndDeps({
      allies: [{ id: 1 }],
      enemies: [
        { id: 10, groupId: 1 },
        { id: 11, groupId: 1, hp: 0 },
        { id: 12, groupId: 1 },
        { id: 13, groupId: 2 },
      ],
    });

    const attacker = allies[0];
    const groupId = enemies[0].enemyGroupId;
    const expected = [enemies[0], enemies[2]];

    const action: AttackPlannedAction = {
      actionType: ActionType.Attack,
      actorId: attacker.actorId,
      // UI でグループ1を選択した想定
      selection: { kind: "group", groupId },
      mode: { kind: "group", groupId },
    };

    const result = resolveAttackTargets(state, action, deps);
    expect(result).toEqual(expected.map(e => e.actorId));
  });

  test("targetのグループが全滅している場合、別のグループの「生存している」敵のみ返す", () => {
    const { state, deps, allies, enemies } = createStateAndDeps({
      allies: [{ id: 1 }],
      enemies: [
        { id: 10, groupId: 1, hp: 0 },  // 死亡している状態
        { id: 11, groupId: 1, hp: 0 },  // 死亡している状態
        { id: 12, groupId: 2 },
        { id: 13, groupId: 2, hp: 0 },  // 死亡している状態
        { id: 14, groupId: 3 },
      ],
    });

    const attacker = allies[0];
    const groupId = enemies[0].enemyGroupId;
    const expected = enemies[2];

    const action: AttackPlannedAction = {
      actionType: ActionType.Attack,
      actorId: attacker.actorId,
      // UI でグループ1を選択した想定
      selection: { kind: "group", groupId },
      mode: { kind: "group", groupId },
    };

    const result = resolveAttackTargets(state, action, deps);

    // グループ1は全滅していて代替のグループ2の生存者(12)のみが選ばれる
    // 別グループの生存者(14)は入らない
    expect(result).toEqual([expected.actorId]);
  });

  test("全滅している場合は空配列を返す", () => {
    const { state, deps, allies, enemies } = createStateAndDeps({
      allies: [{ id: 1 }],
      enemies: [
        { id: 10, groupId: 1, hp: 0 },  // 死亡している状態
        { id: 11, groupId: 2, hp: 0 },  // 死亡している状態
      ],
    });

    const attacker = allies[0];
    const groupId = enemies[0].enemyGroupId;

    const action: AttackPlannedAction = {
      actionType: ActionType.Attack,
      actorId: attacker.actorId,
      // UI でグループ1を選択した想定
      selection: { kind: "group", groupId },
      mode: { kind: "group", groupId },
    };

    const result = resolveAttackTargets(state, action, deps);
    expect(result).toEqual([]);
  });
});

describe("resolveAttackTargets (ally all attack → enemy all)", () => {
  test("「生存している」敵のみ返す", () => {
    const { state, deps, allies, enemies } = createStateAndDeps({
      allies: [{ id: 1 }],
      enemies: [
        { id: 10, groupId: 1, hp: 0 },
        { id: 11, groupId: 2, },
      ],
    });

    const attacker = allies[0];

    const action: AttackPlannedAction = {
      actionType: ActionType.Attack,
      actorId: attacker.actorId,
      selection: { kind: "none" },
      mode: { kind: "all" },
    };

    const result = resolveAttackTargets(state, action, deps);
    expect(result).toEqual([enemies[1].actorId]);
  });

  test("敵が全滅している場合は空配列を返す", () => {
    const { state, deps, allies } = createStateAndDeps({
      allies: [{ id: 1 }],
      enemies: [
        { id: 10, groupId: 1, hp: 0 },  // 死亡している状態
        { id: 11, groupId: 2, hp: 0 },  // 死亡している状態
      ],
    });

    const attacker = allies[0];

    const action: AttackPlannedAction = {
      actionType: ActionType.Attack,
      actorId: attacker.actorId,
      selection: { kind: "none" },
      mode: { kind: "all" },
    };

    const result = resolveAttackTargets(state, action, deps);
    expect(result).toEqual([]);
  });
});

describe("resolveAttackTargets (enemy single attack → ally)", () => {
  describe("明示的 targetId が指定されている場合", () => {
    test("targetId が生存していればそれを返す", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [
          { id: 1 },
          { id: 2 },
        ],
        enemies: [
          { id: 10, groupId: 1 },
        ],
      });

      const attacker = enemies[0];
      const target = allies[0];

      const action: AttackPlannedAction = {
        actionType: ActionType.Attack,
        actorId: attacker.actorId,
        // 敵の行動なのでUI選択はない
        selection: { kind: "none" },
        mode: { kind: "single", targetId: target.actorId },
      };

      const result = resolveAttackTargets(state, action, deps);
      expect(result).toEqual([target.actorId]);
    });

    test("targetId が死亡していれば別のIDを返す", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [
          { id: 1, hp: 0 },
          { id: 2 },
        ],
        enemies: [
          { id: 10, groupId: 1 },
        ],
      });

      const attacker = enemies[0];
      const target = allies[0];
      const expected = allies[1];

      const action: AttackPlannedAction = {
        actionType: ActionType.Attack,
        actorId: attacker.actorId,
        // 敵の行動なのでUI選択はない
        selection: { kind: "none" },
        mode: { kind: "single", targetId: target.actorId },
      };

      const result = resolveAttackTargets(state, action, deps);
      expect(result).toEqual([expected.actorId]);
    });

    test("全滅している場合は空配列を返す", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [
          { id: 1, hp: 0 },
          { id: 2, hp: 0 },
        ],
        enemies: [
          { id: 10, groupId: 1 },
        ],
      });

      const attacker = enemies[0];
      const target = allies[0];

      const action: AttackPlannedAction = {
        actionType: ActionType.Attack,
        actorId: attacker.actorId,
        // 敵の行動なのでUI選択はない
        selection: { kind: "none" },
        mode: { kind: "single", targetId: target.actorId },
      };

      const result = resolveAttackTargets(state, action, deps);
      expect(result).toEqual([]);
    });
  });

  describe("明示的 targetId が指定されていない場合", () => {
    test("生存している Actor がいればそれを返す", () => {
      const { state, deps, allies, enemies } = createStateAndDeps({
        allies: [
          { id: 1, hp: 0 },
          { id: 2 },
        ],
        enemies: [
          { id: 10, groupId: 1 },
        ],
      });

      const attacker = enemies[0];
      const expected = allies[1];

      const action: AttackPlannedAction = {
        actionType: ActionType.Attack,
        actorId: attacker.actorId,
        // 敵の行動なのでUI選択はない
        selection: { kind: "none" },
        mode: { kind: "single" },
      };

      const result = resolveAttackTargets(state, action, deps);
      expect(result).toEqual([expected.actorId]);
    });

    test("全滅している場合は空配列を返す", () => {
      const { state, deps, enemies } = createStateAndDeps({
        allies: [
          { id: 1, hp: 0 },
          { id: 2, hp: 0 },
        ],
        enemies: [
          { id: 10, groupId: 1 },
        ],
      });

      const attacker = enemies[0];

      const action: AttackPlannedAction = {
        actionType: ActionType.Attack,
        actorId: attacker.actorId,
        // 敵の行動なのでUI選択はない
        selection: { kind: "none" },
        mode: { kind: "single" },
      };

      const result = resolveAttackTargets(state, action, deps);
      expect(result).toEqual([]);
    });
  });
});

describe("resolveAttackTargets (enemy all attack → ally all)", () => {
  test("「生存している」味方のみ返す", () => {
    const { state, deps, allies, enemies } = createStateAndDeps({
      allies: [
        { id: 1, hp: 0 },
        { id: 2 }
      ],
      enemies: [
        { id: 10, groupId: 1 },
      ],
    });

    const attacker = enemies[0];

    const action: AttackPlannedAction = {
      actionType: ActionType.Attack,
      actorId: attacker.actorId,
      selection: { kind: "none" },
      mode: { kind: "all" },
    };

    const result = resolveAttackTargets(state, action, deps);
    expect(result).toEqual([allies[1].actorId]);
  });

  test("全滅している場合は空配列を返す", () => {
    const { state, deps, enemies } = createStateAndDeps({
      allies: [
        { id: 1, hp: 0 },
        { id: 2, hp: 0 }
      ],
      enemies: [
        { id: 10, groupId: 1 },
      ],
    });

    const attacker = enemies[0];

    const action: AttackPlannedAction = {
      actionType: ActionType.Attack,
      actorId: attacker.actorId,
      selection: { kind: "none" },
      mode: { kind: "all" },
    };

    const result = resolveAttackTargets(state, action, deps);
    expect(result).toEqual([]);
  });
});
