import { Container, FederatedPointerEvent, Sprite, Texture } from "pixi.js";

export class Button extends Container {
  static readonly MOVE_THRESHOLD_POW2 = 8 * 8;
  #sprite: Sprite;
  #onClick: () => void;

  // 押下管理
  #pressing: boolean;
  #pressedPointerId: number | null;
  #startPos: { x: number, y: number };

  constructor(imageKey: string, onClick: () => void) {
    super();
    this.#sprite = Sprite.from(imageKey);
    this.#sprite.anchor.set(0.5);
    this.addChild(this.#sprite);

    this.eventMode = "static";
    this.#onClick = onClick;
    this.#pressing = false;
    this.#pressedPointerId = null;
    this.#startPos = { x: 0, y: 0 };

    this.on("pointerdown", this.#onDown);
    this.on("pointermove", this.#onMove);
    this.on("pointerup", this.#onUp);
    this.on("pointerupoutside", this.#onUpOutside);
    this.on("pointercancel", this.#onCancel);
    this.on("pointerleave", this.#onLeave);
  }

  changeTexture(imageKey: string): void {
    this.#sprite.texture = Texture.from(imageKey);
  }

  #onDown(e: FederatedPointerEvent): void {
    if (this.#pressing) { return; }

    this.#pressing = true;
    this.#pressedPointerId = e.pointerId;
    this.#startPos = { x: e.globalX, y: e.globalY };
    this.#sprite.scale.set(1.1);
  }

  #onUp(e: FederatedPointerEvent): void {
    if (!this.#pressing || this.#pressedPointerId !== e.pointerId) { return; }

    // 押下継続のまま指を離したので確定
    this.#endPress();
    this.#onClick();
  }

  #onUpOutside(_e: FederatedPointerEvent): void {
    // 押したまま範囲外に出た → キャンセル扱いにする
    this.#cancelPress();
  }

  #onCancel(_e: FederatedPointerEvent): void {
    // ブラウザ/OSからのキャンセル
    this.#cancelPress();
  }

  #onLeave(_e: FederatedPointerEvent): void {
    if (!this.#pressing) { return; }
    this.#cancelPress();
  }

  #onMove(e: FederatedPointerEvent): void {
    if (!this.#pressing || this.#pressedPointerId !== e.pointerId) { return; }

    const dx = e.globalX - this.#startPos.x;
    const dy = e.globalY - this.#startPos.y;
    if (Button.MOVE_THRESHOLD_POW2 <= dx * dx + dy * dy) {
      this.#cancelPress();
    }
  }

  #cancelPress(): void {
    if (!this.#pressing) { return; }
    this.#endPress();
  }

  #endPress(): void {
    this.#pressing = false;
    this.#pressedPointerId = null;
    this.#startPos = { x: 0, y: 0 };
    this.#sprite.scale.set(1.0);
  }
}

export class ToggleButton extends Container {
  #button: Button;
  #keys: { on: string, off: string };
  #isOn: boolean;
  #onToggle?: (isOn: boolean) => void;

  constructor(imageKeys: { on: string, off: string }, initialOn: boolean = false, onToggle?: (isOn: boolean) => void) {
    super();

    this.#keys = imageKeys;
    this.#isOn = initialOn;
    this.#onToggle = onToggle;
    this.#button = new Button(this.#currentKey(), () => {
      this.toggle();
    });

    this.addChild(this.#button);
  }

  get isOn(): boolean {
    return this.#isOn;
  }

  toggle(silent = false): void {
    this.setOn(!this.#isOn, silent);
  }

  setOn(next: boolean, silent = false) {
    if (this.#isOn === next) { return; }
    this.#isOn = next;
    this.#button.changeTexture(this.#currentKey());

    if (!silent) {
      this.#onToggle?.(this.#isOn);
    }
  }

  #currentKey(): string {
    return this.#isOn ? this.#keys.on : this.#keys.off;
  }
}
