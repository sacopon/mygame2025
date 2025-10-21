import { GameObject } from "../../core/game-object";
import { ScreenSizeAware } from "../../core/game-component";
import { BattleMessageWindow, CommandSelectWindow, EnemySelectWindow } from "..";
import { GamePorts } from "@game/presentation";
import { DEFAULT_SHAKE_PATTERNS, ShakeRunner } from "@game/presentation/effects/shake-runner";

type Windows = {
  commandSelectWindow?: CommandSelectWindow;
  enemySelectWindow?: EnemySelectWindow;
  messageWindow?: BattleMessageWindow;
}

type OffsetsByWindow = Map<CommandSelectWindow | EnemySelectWindow | BattleMessageWindow, { dx: number, dy: number }>;

/**
 * 描画を持たないゲームオブジェクト
 * ウィンドウの配置/再配置を司る
 */
export class UILayoutCoordinator extends GameObject implements ScreenSizeAware {
  #commandWindow?: CommandSelectWindow;
  #enemySelectWindow?: EnemySelectWindow;
  #messageWindow?: BattleMessageWindow;
  #shakeRunners = new WeakMap<CommandSelectWindow | EnemySelectWindow | BattleMessageWindow, ShakeRunner>();

  constructor(ports: GamePorts, vw: number, vh: number, windows: Windows) {
    super(ports);

    this.#commandWindow = windows.commandSelectWindow;
    this.#enemySelectWindow = windows.enemySelectWindow;
    this.#messageWindow = windows.messageWindow;
    this.#place(vw, vh);
  }

  override update(deltaMs: number): void {
    const offsets: OffsetsByWindow = new Map<CommandSelectWindow | EnemySelectWindow | BattleMessageWindow, { dx: number, dy: number }>();

    [this.#commandWindow, this.#enemySelectWindow, this.#messageWindow]
      .forEach(window => {
        if (!window) { return; }
        const runner = this.#shakeRunners.get(window);
        if (!runner) { return; }

        runner.update(deltaMs);
        offsets.set(window, runner.getCurrentOffset());
      });

    if (0 < offsets.size) {
      console.log("揺れ発生中！");
      const size = this.ports.screen.getGameSize();
      this.#place(size.width, size.height, offsets);
    }
  }

  onScreenSizeChanged(width: number, height: number): void {
    // TODO: this.port.screen.getGameSize() から適用する
    this.#place(width, height);
  }

  shake(window?: CommandSelectWindow | EnemySelectWindow | BattleMessageWindow): void {
    if (!window) { return; }
    const patterns = DEFAULT_SHAKE_PATTERNS;
    const runner = new ShakeRunner(patterns);
    runner.start();
    this.#shakeRunners.set(window, runner);
  }

  #place(width: number, height: number, offsets?: OffsetsByWindow) {
    this.#placeInputWindow(width, height, offsets);
    this.#placeMessageWindow(width, height, offsets);
  }

  #placeInputWindow(width: number, _height: number, offsets?: OffsetsByWindow) {
    if (!this.#commandWindow || !this.#enemySelectWindow) {
      return;
    }

    const windowWidth = this.#commandWindow.width + this.#enemySelectWindow.width;
    const x = Math.floor((width - windowWidth) / 2);
    const y = 120;

    {
      const offset = offsets?.get(this.#commandWindow) || { dx: 0, dy: 0 };
      this.#commandWindow.setPosition(x + offset.dx, y + offset.dy);
    }

    {
      const offset = offsets?.get(this.#enemySelectWindow) || { dx: 0, dy: 0 };
      this.#enemySelectWindow.setPosition(x + this.#commandWindow.width + offset.dx, this.#commandWindow.transform.y + 19 + offset.dy);
    }
  }

  #placeMessageWindow(width: number, _height: number, offsets?: OffsetsByWindow) {
    if (!this.#messageWindow) {
      return;
    }

    const offset = offsets?.get(this.#messageWindow) || { dx: 0, dy: 0 };
    this.#messageWindow.setPosition(Math.floor((width - this.#messageWindow.width) / 2) + offset.dx, 140 + offset.dy);
  }
}
