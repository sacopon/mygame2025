import { GameObject } from "../../core/game-object";
import { BlinkController } from "../..";
import { SpriteComponent } from "@game/presentation/component";
import { GamePorts } from "@game/presentation";
import { EnemyId } from "@game/domain";

const makeEnemyTextureKey = (enemyId: EnemyId) => {
  const idStr = `0000${enemyId}`.slice(-4);
  return `${idStr}.png`;
};

/**
 * 敵キャラクター画像
 */
export class EnemyView extends GameObject {
  #index: number;
  #blinkController: BlinkController;
  #sprite: SpriteComponent;
  #dead: boolean;

  constructor(ports: GamePorts, enemyId: EnemyId, vw: number, vh: number, index: number) {
    super(ports);

    this.#blinkController = new BlinkController(50);
    this.#dead = false;
    this.#index = index;
    this.#sprite = this.addComponent(new SpriteComponent({
      imageId: makeEnemyTextureKey(enemyId),
      anchor: { x: 0.5, y: 1.0 },
    }))!;
  }

  override update(deltaMs: number): void {
    super.update(deltaMs);

    this.#blinkController.update(deltaMs);
    this.#sprite.visible = !this.#dead && (this.#blinkController.isBlinking ? this.#blinkController.visible : true);
  }

  get width(): number {
    return this.#sprite.width;
  }

  get height(): number {
    return this.#sprite.height;
  }

  blinkByDamage(durationMs: number) {
    this.#blinkController.start(durationMs);
  }

  hideByDefeat(): void {
    this.#dead = true;
    this.#sprite.visible = false;
  }
}
