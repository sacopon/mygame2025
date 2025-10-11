import { Background, BattleBackground, Enemy, MainWindow, Smile, UILayoutCoordinator } from "@game/game-object/elements";
import { Scene, SceneContext, SceneId } from "@game/scene/core";
import { CommandSelectWindowBuilder, EnemySelectWindowBuilder } from "@game/game-object";
import { BattleSceneContext, BattleSceneState, BattleSceneStateSelectCharacterCommand } from "./states/index.internal";
import { ActorId, findActor } from "@game/repository";

/**
 * 戦闘でのキャラクターの行動コマンド
 */
export const BattleCommand = {
  Attack: "こうげき",  // 攻撃
  Spell: "じゅもん",   // 呪文
  Item: "どうぐ",      // 道具
  Defence: "ぼうぎょ", // 防御
} as const;
export type BattleCommand = typeof BattleCommand[keyof typeof BattleCommand];

// 各キャラクターのコマンド選択結果
export type CommandChoice = {
  actorId: ActorId;       // 誰が
  command: BattleCommand; // どのコマンド
  target?: string;        // 対象(対象が必要なコマンドの場合)
};

export class BattleScene implements Scene {
  #context!: BattleSceneContext;
  #stateStack: BattleSceneState[] = [];
  #pendingStateProcs: (() => void)[] = [];

  public constructor() {
  }

  onEnter(context: SceneContext) {
    const { width, height } = context.ports.screen.getGameSize();

    context.gameObjectAccess.spawnGameObject(new Background(context.ports, width, height));
    context.gameObjectAccess.spawnGameObject(new BattleBackground(context.ports, width, height));
    context.gameObjectAccess.spawnGameObject(new MainWindow(context.ports, width, height));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 0));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 1));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 2));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 3));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 4));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 5));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 6));
    context.gameObjectAccess.spawnGameObject(new Enemy(context.ports, width, height, 7));
    context.gameObjectAccess.spawnGameObject(new Smile(context.ports, width, height));

    // コマンド選択ウィンドウ
    const commandSelectWindowBuilder = new CommandSelectWindowBuilder(context.gameObjectAccess, context.ports);
    const commandSelectWindow = commandSelectWindowBuilder.build();

    // 敵選択ウィンドウ
    const enemySelectWindowBuilder = new EnemySelectWindowBuilder(context.gameObjectAccess, context.ports);
    const enemySelectWindow = enemySelectWindowBuilder.build();

    // レイアウトコーディネイター
    context.gameObjectAccess.spawnGameObject(
      new UILayoutCoordinator(
        context.ports, width, height, {
          commandSelectWindow,
          enemySelectWindow,
        })
    );

    this.#context = {
      ports: context.ports,
      commandSelectWindow,
      enemySelectWindow,
      commandChoices: [],
    };

    // キャラクターコマンド選択から開始
    this.#startOrNextActor(1);
  }

  #startOrNextActor(actorId: ActorId): void {
    // TODO: ID と人数は別で管理する
    if (4 <= this.#context.commandChoices.length) {
      console.log("全員確定!");
      // TODO: 次のステートへ
      return;
    }

    const state = new BattleSceneStateSelectCharacterCommand(this, actorId, (c) => {
      const actor = findActor(c.actorId);
      console.log(`${actor!.name} が ${c.target!} に ${c.command}`);
      // CommandDecider を導入する
      // コマンド選択ウィンドウと敵選択ウィンドウの共通クラスを作る
      // コマンド選択ウィンドウのあたまにキャラクタ名をひょうじできるようにする

      // コマンドを記録
      this.#context.commandChoices.push(c);

      // 次の人の番へ
      this.#startOrNextActor(actorId + 1);
    });

    if (this.#hasState()) {
      this.requestPushState(state);
    }
    else {
      this.#pushState(state);
    }
  }

  next(): SceneId {
    throw new Error("Method not implemented.");
  }

  update(deltaTime: number): boolean {
    if (!this.#hasState()) {
      // TODO: シーン終了
      return true;
    }

    // ステートの処理を実行
    this.#topState().update(deltaTime);

    // ステート遷移の実行
    const procs = this.#pendingStateProcs;
    this.#pendingStateProcs = [];
    procs.forEach(proc => proc());

    // 遷移の結果全部スタックが捌けた場合
    if (!this.#hasState()) {
      // TODO: シーン終了
      return true;
    }

    return false;
  }

  requestPushState(state: BattleSceneState): void {
    this.#pendingStateProcs.push(() => {
      this.#pushState(state);
    });
  }

  requestPopState(): void {
    this.#pendingStateProcs.push(() => {
      this.#popState();
    });
  }

  requestReplaceTopState(state: BattleSceneState): void {
    this.#pendingStateProcs.push(() => {
      this.#replaceTopState(state);
    });
  }

  #topState(): BattleSceneState {
    return this.#stateStack.at(-1)!;
  }

  #hasState(): boolean {
    return 0 < this.#stateStack.length;
  }

  #pushState(state: BattleSceneState): void {
    if (this.#hasState()) {
      const current = this.#stateStack[this.#stateStack.length - 1];
      current.onSuspend();
    }

    this.#stateStack.push(state);
    state.onEnter(this.#context!);
  }

  #popState(): void {
    if (!this.#hasState()) {
      return;
    }

    const state = this.#stateStack.pop()!;
    state.onLeave(this.#context!);

    if (0 < this.#stateStack.length) {
      this.#stateStack[this.#stateStack.length - 1].onResume();
    }
  }

  #replaceTopState(nextState: BattleSceneState): void {
    if (this.#hasState()) {
      const state = this.#stateStack.pop()!;
      state.onLeave(this.#context!);
    }

    this.#stateStack.push(nextState);
    nextState.onEnter(this.#context!);
  }
}
