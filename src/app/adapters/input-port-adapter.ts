import { InputPort, GameButton } from "@game/ports/input-port";
import { PAD_BIT, InputState } from "@shared";

function toBit(button: GameButton): number {
  let bit: number = 0;

  switch (button) {
    case GameButton.Up:
      bit = 1 << PAD_BIT.DPAD_UP;
      break;

    case GameButton.Down:
      bit = 1 << PAD_BIT.DPAD_DOWN;
      break;

    case GameButton.Left:
      bit = 1 << PAD_BIT.DPAD_LEFT;
      break;

    case GameButton.Right:
      bit = 1 << PAD_BIT.DPAD_RIGHT;
      break;

    case GameButton.A:
      bit = 1 << PAD_BIT.BUTTON1;
      break;

    case GameButton.B:
      bit = 1 << PAD_BIT.BUTTON2;
      break;

    case GameButton.Start:
      bit = 1 << PAD_BIT.BUTTON3;
      break;

    case GameButton.Select:
      bit = 1 << PAD_BIT.BUTTON4;
      break;
  }

  return bit;
}

export class InputPortAdapter implements InputPort {
  #state: InputState;

  constructor(state: InputState) {
    this.#state = state;
  }

  snapshot(): number {
    return this.#state.composed();
  }

  snapshotPrev(): number {
    return this.#state.previousComposed();
  }

  isDown(btn: GameButton): boolean {
    return (this.snapshot() & toBit(btn)) !== 0;
  }

  pressed(button: GameButton): boolean {
    const current = this.snapshot();
    const prev = this.snapshotPrev();
    const bit = toBit(button);

    return (current & bit) !== 0 && (prev & bit) === 0;
  }

  released(button: GameButton): boolean {
    const current = this.snapshot();
    const prev = this.snapshotPrev();
    const bit = toBit(button);

    return (current & bit) === 0 && (prev & bit) !== 0;
  }

  axisX(): number {
    return (this.isDown(GameButton.Right) ? 1 : 0) - (this.isDown(GameButton.Left) ? 1 : 0);
  }
  axisY(): number {
    return (this.isDown(GameButton.Down) ? 1 : 0) - (this.isDown(GameButton.Up) ? 1 : 0);
  }
}
