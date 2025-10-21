import { GameObject } from "../../core/game-object";
import { BlinkController, ScreenSizeAware } from "../..";
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
export class EnemyView extends GameObject implements ScreenSizeAware {
  #index: number;
  #blinkController: BlinkController;
  #sprite: SpriteComponent;

  constructor(ports: GamePorts, enemyId: EnemyId, vw: number, vh: number, index: number) {
    super(ports);

    this.#blinkController = new BlinkController(50);
    this.#index = index;
    const pos = this.#calcPosition(vw, vh, this.#index);
    this.setPosition(pos.x, pos.y);
    this.#sprite = this.addComponent(new SpriteComponent({
      imageId: makeEnemyTextureKey(enemyId),
      anchor: { x: 0.5, y: 1.0 },
    }))!;
  }

  override update(deltaMs: number): void {
    super.update(deltaMs);

    this.#blinkController.update(deltaMs);
    this.#sprite.visible = this.#blinkController.isBlinking ? this.#blinkController.visible : true;
  }

  blinkByDamage(durationMs: number) {
    this.#blinkController.start(durationMs);
  }

  onScreenSizeChanged() {
    const { width, height } = this.ports.screen.getGameSize();
    const pos = this.#calcPosition(width, height, this.#index);
    this.setPosition(pos.x, pos.y);
  }

  #calcPosition(vw: number, vh: number, index: number): { x: number, y: number } {
    const x = (vw - 36 * 5) / 2 + index * 36;
    const y = vh / 2 + 16;

    return { x, y };
  }
}
