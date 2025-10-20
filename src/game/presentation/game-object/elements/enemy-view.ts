import { GameObject } from "../../core/game-object";
import { ScreenSizeAware } from "../../core/game-component";
import { SpriteComponent } from "@game/presentation/component";
import { GamePorts } from "@game/presentation";

class BlinkController {
  /** 点滅間隔(1回の点滅ON/OFFサイクルの長さ) */
  readonly #blinkIntervalMs: number;
  /** 点滅演出全体の合計時間(ms) */
  #blinkDurationMs: number = 0;
  /** 点滅中フラグ */
  #blinking = false;
  /** 表示/非表示フラグ */
  #visible = true;
  /** 点滅演出の経過時間(ms) */
  #blinkElapsedMs = 0;
  /** ON/OFF 切り替えのためのカウンタ */
  #blinkTickMs = 0;

  constructor(intervalMs = 100) {
    this.#blinkIntervalMs = intervalMs;
  }

  get isBlinking(): boolean {
    return this.#blinking;
  }

  get visible(): boolean {
    return this.#visible;
  }

  start(durationMs: number): void {
    this.#blinking = true;
    this.#blinkDurationMs = Math.max(0, durationMs);
    this.#blinkElapsedMs = 0;
    this.#blinkTickMs = 0;
    this.#visible = false; // 開始時は不可視状態
  }

  update(deltaMs: number) {
    if (!this.isBlinking) {
      return;
    }

    this.#blinkElapsedMs += deltaMs;
    this.#blinkTickMs += deltaMs;

    if (this.#blinkIntervalMs <= this.#blinkTickMs) {
      this.#blinkTickMs = 0;
      this.#visible = !this.#visible;
    }

    if (this.#blinkDurationMs <= this.#blinkElapsedMs) {
      // 演出時間が経過. 可視状態に戻して終了
      this.#visible = true;
      this.#blinking = false;
    }
  }
}

export class EnemyView extends GameObject implements ScreenSizeAware {
  #index: number;
  #blinkController: BlinkController;
  #sprite: SpriteComponent;

  constructor(ports: GamePorts, vw: number, vh: number, index: number) {
    super(ports);

    this.#blinkController = new BlinkController(50);
    this.#index = index;
    const pos = this.#calcPosition(vw, vh, this.#index);
    this.setPosition(pos.x, pos.y);
    this.#sprite = this.addComponent(new SpriteComponent({
      imageId: "enemy24x24.png",
      anchor: { x: 0.5, y: 0.5 },
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

  onScreenSizeChanged(vw: number, vh: number) {
    const pos = this.#calcPosition(vw, vh, this.#index);
    this.setPosition(pos.x, pos.y);
  }

  #calcPosition(vw: number, vh: number, index: number): { x: number, y: number } {
    const x = (vw / 2 - (24 * 8) / 2 + 12 + index * 24) | 0;
    const y = vh / 2;

    return { x, y };
  }
}
