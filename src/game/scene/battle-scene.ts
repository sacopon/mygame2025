import { Background, BattleBackground, Enemy, MainWindow, Smile, UILayoutCoordinator } from "@game/game-object/elements";
import { Scene, SceneContext, SceneId } from "./scene";
import { CommandSelectWindowBuilder, EnemySelectWindowBuilder } from "@game/game-object";

enum StateId {
  SelectCharacterCommand = "SelectCharacterCommand",
}

/**
 * バトルシーン状態
 */
interface BattleSceneState {
  getId(): StateId;
  onEnter(): void;
}

/**
 * バトルシーン状態: キャラクターの行動選択
 */
class BattleSceneStateSelectCharacterCommand implements BattleSceneState {
  getId(): StateId {
    return StateId.SelectCharacterCommand;
  }

  onEnter() {

  }
}

export class BattleScene implements Scene {
  #state: BattleSceneState;

  public constructor() {
    // キャラクターコマンド選択から開始
    this.#state = this.#createState(StateId.SelectCharacterCommand);
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

    // TODO: [テスト]コマンド選択ウィンドウをアクティブに
    // enemySelectWindow.setActive(true);
    commandSelectWindow.setActive(true);
  }

  next(): SceneId {
    throw new Error("Method not implemented.");
  }

  update(_deltaTime: number): boolean {
    return false;
  }

  #createState(id: StateId): BattleSceneState {
    let state: BattleSceneState | null;

    switch (id) {
      case StateId.SelectCharacterCommand:
        state = new BattleSceneStateSelectCharacterCommand();
        break;

      default:
        new Error(`Unknown StateId.[${id}]`);
        break;
    }

    return state!;
  }
}
