import { GameObject } from "../../core/game-object";
import { ScreenSizeAware } from "../../core/game-component";
import { BattleMessageWindow, CommandSelectWindow, EnemySelectWindow, MainWindow } from "..";
import { GamePorts } from "@game/presentation";
import { DEFAULT_SHAKE_PATTERNS, ShakeRunner } from "@game/presentation/effects/shake-runner";
import { StatusWindow } from "./window/status-window";

type Windows = {
  mainWindow?: MainWindow;
  commandSelectWindow?: CommandSelectWindow;
  enemySelectWindow?: EnemySelectWindow;
  messageWindow?: BattleMessageWindow;
  statusWindow?: StatusWindow;
}

type Window = CommandSelectWindow | EnemySelectWindow | BattleMessageWindow | StatusWindow | MainWindow;
type OffsetsByWindow = Map<Window, { dx: number, dy: number }>;

const statusWindowY = 12;
const battleMessageWindowY = 148;

/**
 * 描画を持たないゲームオブジェクト
 * ウィンドウの配置/再配置を司る
 */
export class UILayoutCoordinator extends GameObject implements ScreenSizeAware {
  #mainWindow?: MainWindow;
  #commandWindow?: CommandSelectWindow;
  #enemySelectWindow?: EnemySelectWindow;
  #messageWindow?: BattleMessageWindow;
  #statusWindow?: StatusWindow;
  #shakeRunners = new WeakMap<Window, ShakeRunner>();

  constructor(ports: GamePorts, vw: number, vh: number, windows: Windows) {
    super(ports);

    // TODO: MainWindow の枠だけ揺らす
    this.#mainWindow = windows.mainWindow;
    this.#commandWindow = windows.commandSelectWindow;
    this.#enemySelectWindow = windows.enemySelectWindow;
    this.#messageWindow = windows.messageWindow;
    this.#statusWindow = windows.statusWindow;
    this.#place();
  }

  override update(deltaMs: number): void {
    const offsets: OffsetsByWindow = new Map<Window, { dx: number, dy: number }>();

    [this.#mainWindow, this.#commandWindow, this.#enemySelectWindow, this.#messageWindow, this.#statusWindow]
      .forEach(window => {
        if (!window) { return; }
        const runner = this.#shakeRunners.get(window);
        if (!runner) { return; }

        runner.update(deltaMs);
        offsets.set(window, runner.getCurrentOffset());
      });

    if (0 < offsets.size) {
      this.#place(offsets);
    }
  }

  onScreenSizeChanged(): void {
    this.#place();
  }

  shake(window?: Window): void {
    if (!window) { return; }
    const patterns = DEFAULT_SHAKE_PATTERNS;
    const runner = new ShakeRunner(patterns);
    runner.start();
    this.#shakeRunners.set(window, runner);
  }

  #place(offsets?: OffsetsByWindow) {
    const { width, height } = this.ports.screen.getGameSize();
    this.#placeCommonWindow(width, height, offsets);
    this.#placeInputWindow(width, height, offsets);
    this.#placeMessageWindow(width, height, offsets);
  }

  #placeCommonWindow(width: number, height: number, offsets?: OffsetsByWindow) {
    if (!this.#mainWindow || !this.#statusWindow) {
      return;
    }

    // メインウィンドウ
    {
      this.#mainWindow?.setPosition(Math.floor(width / 2), Math.floor(height / 2) - 12);
      // メインウィンドウはシェイク時に枠のみ揺れるようにするため別メソッドで対応
      this.#mainWindow?.shake(offsets?.get(this.#mainWindow) || { dx: 0, dy: 0 });
    }

    // ステータスウィンドウ
    {
      const offset = offsets?.get(this.#statusWindow) || { dx: 0, dy: 0 };
      this.#statusWindow?.setPosition(Math.floor((width - BattleMessageWindow.width) / 2) + offset.dx, statusWindowY + offset.dy);
    }
  }

  #placeInputWindow(width: number, _height: number, offsets?: OffsetsByWindow) {

    if (!this.#commandWindow || !this.#enemySelectWindow) {
      return;
    }

    const windowWidth = this.#commandWindow.width + this.#enemySelectWindow.width;
    const x = Math.floor((width - windowWidth) / 2);
    const y = 120;

    // コマンドウィンドウ
    {
      const offset = offsets?.get(this.#commandWindow) || { dx: 0, dy: 0 };
      this.#commandWindow.setPosition(x + offset.dx, y + offset.dy);
    }

    // 敵選択ウィンドウ
    {
      const offset = offsets?.get(this.#enemySelectWindow) || { dx: 0, dy: 0 };
      this.#enemySelectWindow.setPosition(x + this.#commandWindow.width + offset.dx, this.#commandWindow.transform.y + 19 + offset.dy);
    }
  }

  #placeMessageWindow(width: number, _height: number, offsets?: OffsetsByWindow) {
    if (!this.#messageWindow) {
      return;
    }

    // メッセージウィンドウ
    {
      const offset = offsets?.get(this.#messageWindow) || { dx: 0, dy: 0 };
      this.#messageWindow.setPosition(Math.floor((width - this.#messageWindow.width) / 2) + offset.dx, battleMessageWindowY + offset.dy);
    }
  }
}
