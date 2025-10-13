import { Scene } from "../../scene/core/scene";
import { BattleSceneContext, BattleSceneState, InputPhaseSelectCommandState } from "./states";
import { Background, BattleBackground, CommandSelectWindow, Enemy, EnemySelectWindow, MainWindow, UILayoutCoordinator } from "@game/game-object";
import { ActorId, findActor } from "@game/repository";
import { SceneContext, SceneId } from "@game/scene";
import { StateStack } from "@game/shared";

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

/**
 * バトルシーンクラス
 * バトルシーンのステート遷移を管理
 */
export class BattleScene implements Scene {
  #context!: BattleSceneContext;
  #stateStack!: StateStack<BattleSceneContext>;
  #partyActorIds: ReadonlyArray<number> = [];

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

    // パーティ編成
    this.#partyActorIds = [1, 2, 3, 4];

    const commands = [
      BattleCommand.Attack,
      BattleCommand.Spell,
      BattleCommand.Defence,
      BattleCommand.Item,
    ];
    const commandSelectWindow = context.gameObjectAccess
      .spawnGameObject(new CommandSelectWindow(context.ports, commands)) as CommandSelectWindow;

    // 敵選択ウィンドウ
    const enemies = [
      { name: "グレイトドラゴン", count:1 },
      { name: "スライム", count: 8 },
      { name: "さまようよろい", count: 4 },
      { name: "ドラキー", count: 7 },
    ];

    const enemySelectWindow = context.gameObjectAccess
      .spawnGameObject(new EnemySelectWindow(context.ports, enemies)) as EnemySelectWindow;

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
    this.#stateStack = new StateStack<BattleSceneContext>(this.#context);

    // キャラクターコマンド選択から開始
    this.#startOrNextActor();
  }

  #startOrNextActor(): void {
    // TODO: ID と人数は別で管理する
    if (this.isAllConfirmed) {
      console.log("全員確定!");
      // TODO: 次のステートへ
      return;
    }

    const state = new InputPhaseSelectCommandState(
      this,
      this.currentActorId,
      {
        // 決定可能か
        canDecide: _c => true,
        // 決定(確定)時処理
        onDecide: (c) => {
          const actor = findActor(c.actorId);
          console.log(`${actor!.name} が ${c.target!} に ${c.command}`);
          // コマンド選択ウィンドウと敵選択ウィンドウの共通クラスを作る
          // コマンド選択ウィンドウのあたまにキャラクタ名を表示できるようにする

          // コマンドを記録
          this.#context.commandChoices.push(c);

          // 次の人の番へ
          this.#startOrNextActor();
        },
        // キャンセル可能か
        canCancel: (_actorId: ActorId) => {
          return 0 < this.progressIndex;
        },
        // キャンセル時処理
        onCancel: (_actorId: ActorId) => {
          if (this.#context.commandChoices.length === 0) {
            throw new Error("先頭のキャラの行動はキャンセル不可");
          }

          // 決定内容の破棄
          this.#context.commandChoices.pop();

          // 前の人の番へ
          this.#startOrNextActor();
        },
      });

    this.#open(state);
  }

  next(): SceneId {
    throw new Error("Method not implemented.");
  }

  update(deltaTime: number): boolean {
    if (!this.#stateStack.hasAny()) {
      // TODO: シーン終了
      return true;
    }

    // ステートの処理を実行
    this.#stateStack.update(deltaTime);

    if (!this.#stateStack.hasAny()) {
      // TODO: シーン終了
      return true;
    }

    return false;
  }

  get isAllConfirmed(): boolean {
    return this.#partyActorIds.length <= this.progressIndex;
  }

  get progressIndex(): number {
    return this.#context.commandChoices.length;
  }

  get currentActorId(): number {
    return this.#partyActorIds[this.progressIndex];
  }

  requestPushState(state: BattleSceneState): void {
    this.#stateStack.requestPush(state);
  }

  requestPopState(): void {
    this.#stateStack.requestPop();
  }

  requestReplaceTopState(state: BattleSceneState): void {
    this.#stateStack.requestReplaceTop(state);
  }

  requestRewindTo(depth: number): void {
    this.#stateStack.requestRewindTo(depth);
  }

  markState(): number {
    return this.#stateStack.mark();
  }

  #open(state: BattleSceneState): void {
    if (this.#stateStack.hasAny()) {
      this.#stateStack.requestPush(state);
    }
    else {
      this.#stateStack.push(state);
    }
  }
}
