import { GameObject } from "../../core/game-object";
import { SpriteComponent } from "@game/component";
import { GamePorts } from "@game/core";

/**
 * ウィンドウ内に表示する点滅カーソル
 * 初期状態では非表示なので setEnable(true) で表示状態にすること
 */
export class WindowCursor extends GameObject {
  #timeMS: number = 0;
  #enable: boolean = false;
  #sprite: SpriteComponent;

  static readonly Settings = {
    blinkRate: 40,
    displayCount: 30,
    onMS: 30,
    offMS: 10,
  };

  constructor(ports: GamePorts) {
    super(ports);

    this.#sprite = this.addComponent(new SpriteComponent({
      imageId: "cursor_right.png",
      anchor: { x: 1.0, y: 0.5 },
      visible: false,
    }))!;
  }

  override update(deltaTime: number) {
    super.update(deltaTime);

    // 無効時は消して終了する
    if (!this.#enable) {
      if (this.#sprite.visible) {
        this.#sprite.visible = false;
      }
      return;
    }

    // 実時間ベースで点滅させる
    this.#timeMS += Math.min(deltaTime, 1000);  // 1秒を超える deltaTime は無視
    const cycle = WindowCursor.Settings.onMS + WindowCursor.Settings.offMS;
    const phase = this.#timeMS % cycle;
    const isOn = phase < WindowCursor.Settings.onMS;
    this.#sprite.visible = isOn;
  }

  setEnable(enable: boolean) {
    if (this.#enable === enable) {
      return;
    }

    this.#enable = enable;
    this.#sprite.visible = enable;
    this.#resetAnimation(); // 表示→非表示/非表示→表示、どちらでも一旦リセット
  }

  setCursorMiddleRight(x: number, y: number) {
    this.setPosition(x, y);
    this.#resetAnimation();
  }

  #resetAnimation() {
    this.#timeMS = 0;
  }
}
