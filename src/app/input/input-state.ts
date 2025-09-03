export class InputState
{
  private keyState: number = 0;
  private touchState: number = 0;
  private previousComposedState: number = 0;

  public constructor() {
  }

  public setKey(bit: number, down: boolean) {
    this.keyState = down ? (this.keyState | (1 << bit)) : (this.keyState & ~(1 << bit));
  }

  public setTouch(bit: number, down: boolean) {
    this.touchState = down ? (this.touchState | (1 << bit)) : (this.touchState & ~(1 << bit));
  }

  public clearTouchDir() {
    this.touchState &= ~0b1111;
  }

  public composed() {
    return this.keyState | this.touchState;
  }

  public previousComposed() {
    return this.previousComposedState;
  }

  public next() {
    this.previousComposedState = this.composed();
  }
};
