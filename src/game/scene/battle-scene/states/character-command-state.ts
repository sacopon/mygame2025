import { GameButton } from "@game/ports";
import { BattleCommand, BattleScene, CommandChoice } from "@game/scene/battle-scene";
import { BaseBattleSceneState, BattleSceneContext, BattleSceneStateSelectEnemy } from "./index.internal";
import { ActorId, findActor } from "@game/repository";

/**
 * バトルシーン状態: キャラクターの行動選択
 */
export class BattleSceneStateSelectCharacterCommand extends BaseBattleSceneState {
  #scene: BattleScene;
  #onDecide: (c: CommandChoice) => void;
  #actorId: ActorId;

  constructor(scene: BattleScene, actorId: ActorId, onDecide: (c: CommandChoice) => void) {
    super();
    console.log(`${findActor(actorId).name}のコマンドを選択`);
    this.#scene = scene;
    this.#actorId = actorId;
    this.#onDecide = onDecide;
  }

  onEnter(context: BattleSceneContext): void {
    super.onEnter(context);
    this.#activate();
  }

  onLeave(_context: BattleSceneContext): void {
    this.#inactivate();
  }

  onSuspend(): void {
    this.#inactivate();
  }

  onResume(): void {
    this.#activate();
  }

  update(_deltaTime: number): void {
    const inp = this.context.ports.input;
    const ok = inp.pressed(GameButton.A);
    const up = inp.pressed(GameButton.Up);
    const down = inp.pressed(GameButton.Down);

    // 決定
    if (ok) {
      console.log("決定");
      const command = this.context.commandSelectWindow.getCurrent();

      if (command === BattleCommand.Attack) {
        this.#scene.requestPushState(new BattleSceneStateSelectEnemy(this.#scene, target => {
          // 敵選択確定時
          this.context.commandSelectWindow.reset();
          this.context.enemySelectWindow.reset();

          this.#scene.requestPopState();
          this.#onDecide({
            actorId: this.#actorId,
            command,
            target,
          });
        }));
      }
      else {
        // TODO: コマンドによって次のステートは異なる
        // TODO: 「じゅもん」選択時 - BattleSceneStateSelectSpell
        // TODO: 「どうぐ」選択時 - BattleSceneStateSelectItem
        // TODO: 「ぼうぎょ」選択時 - (次のキャララクターの)BattleSceneStateSelectCharacterCommand
      }
    }
    else if (up) {
      // カーソル上移動
      this.context.commandSelectWindow.selectPrev();
    }
    else if (down) {
      // カーソル下移動
      this.context.commandSelectWindow.selectNext();
    }
  }

  #activate(): void {
    this.context.commandSelectWindow.setActive(true);
  }

  #inactivate(): void {
    this.context.commandSelectWindow.setActive(false);
  }
}
