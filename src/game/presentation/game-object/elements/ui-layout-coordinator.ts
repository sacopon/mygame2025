import { GameObject } from "../../core/game-object";
import { ScreenSizeAware } from "../../core/game-component";
import { AllySelectWindow, BattleMessageWindow, CommandSelectWindow, EnemySelectWindow, MainWindow, SpellDetailWindow, SpellSelectWindow } from "..";
import { GamePorts } from "@game/presentation";
import { DEFAULT_SHAKE_PATTERNS, ShakeRunner } from "@game/presentation/effects/shake-runner";
import { StatusWindow } from "./window/status-window";
import { Position } from "@shared";

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
  #spellSelectWindow?: SpellSelectWindow;
  #spellDetailWindow?: SpellDetailWindow;
  #allySelectWindow?: AllySelectWindow;
  #messageWindow?: BattleMessageWindow;
  #statusWindow?: StatusWindow;
  #shakeRunners = new WeakMap<Window, ShakeRunner>();

  constructor(ports: GamePorts, vw: number, vh: number, windows: Windows) {
    super(ports);

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

  placeSpellSelectWindow(window: SpellSelectWindow | null): void {
    this.#spellSelectWindow = window ?? undefined;
    if (!window) {
      return;
    }

    const pos = this.#getSpellSelectWindowPos();
    window.setPosition(pos.x, pos.y);
  }

  placeSpellDetailWindow(window: SpellDetailWindow | null): void {
    this.#spellDetailWindow = window ?? undefined;
    if (!window) {
      return;
    }

    const pos = this.#getSpellDetailWindowPos();
    window.setPosition(pos.x, pos.y);
    console.log(`select:(${this.#spellSelectWindow!.width}`);
    console.log(`detail:(${this.#spellDetailWindow!.width}`);
  }

  placeAllySelectWindow(window: AllySelectWindow | null): void {
    this.#allySelectWindow = window ?? undefined;
    if (!window) {
      return;
    }

    const pos = this.#getAllySelectWindowPos();
    window.setPosition(pos.x, pos.y);
  }

  bringToFrontEnemySelectWindow(window: EnemySelectWindow | null): void {
    this.#bringToWindow(window);
  }

  bringToFrontSpellSelectWindow(window: SpellSelectWindow | null): void {
    this.#bringToWindow(window);
  }

  bringToFrontSpellDetailWindow(window: SpellDetailWindow | null): void {
    this.#bringToWindow(window);
  }

  bringToFrontAllySelectWindow(window: AllySelectWindow | null): void {
    this.#bringToWindow(window);
  }

  #bringToWindow(window: GameObject | null): void {
    if (!window) {
      return;
    }

    window.bringToTop();
  }

  #place(offsets?: OffsetsByWindow) {
    const { width, height } = this.ports.screen.getGameSize();
    this.#placeCommonWindow(width, height, offsets);
    this.#placeInputWindow(width, height, offsets);
    this.#placeMessageWindow(width, height, offsets);

    if (this.#spellSelectWindow) {
      this.placeSpellSelectWindow(this.#spellSelectWindow);
    }

    if (this.#allySelectWindow) {
      this.placeAllySelectWindow(this.#allySelectWindow);
    }
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

    const x = Math.floor((width - this.inputWindowWidth) / 2);
    const y = 120;

    // コマンドウィンドウ
    {
      const offset = offsets?.get(this.#commandWindow) || { dx: 0, dy: 0 };
      this.#commandWindow.setPosition(x + offset.dx, y + offset.dy);
    }

    // 敵選択ウィンドウ
    {
      // TODO: オフセット要らないはず（揺れないので）
      const offset = offsets?.get(this.#enemySelectWindow) || { dx: 0, dy: 0 };
      this.#enemySelectWindow.setPosition(x + this.#commandWindow.width + offset.dx, this.#commandWindow.y + 19 + offset.dy);
    }

    // 呪文選択ウィンドウ
    if (this.#spellSelectWindow) {
      this.placeSpellSelectWindow(this.#spellSelectWindow);
    }

    // 呪文詳細ウィンドウ
    if (this.#spellDetailWindow) {
      this.placeSpellDetailWindow(this.#spellDetailWindow);
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

  #getSpellSelectWindowPos(): Position {
    const { width } = this.ports.screen.getGameSize();
    const windowWidth = 214;  // 呪文選択ウィンドウ幅 + 呪文詳細ウィンドウ幅
    // const x = Math.floor((width - this.inputWindowWidth) / 2);
    // return { x: x + Math.floor((this.#commandWindow?.width ?? 0) / 2), y: (this.#commandWindow?.y ?? 0) + 19 };
    return { x: Math.trunc(width - windowWidth) / 2, y: (this.#commandWindow?.y ?? 0) + 19 };
  }

  #getSpellDetailWindowPos(): Position {
    const base = {
      x: this.#spellSelectWindow?.x ?? 0,
      y: this.#spellSelectWindow?.y ?? 0,
      width: this.#spellSelectWindow?.width ?? 0,
      height: this.#spellSelectWindow?.height ?? 0,
    };

    return {
      x: base.x + base.width,
      y: base.y + base.height - (this.#spellDetailWindow?.height ?? 0),
    };
  }

  // 味方選択ウィンドウの位置
  // 呪文選択ウィンドウの右(はみ出してしまう分は左にずらす)
  #getAllySelectWindowPos(): Position {
    if (!this.#spellSelectWindow || !this.#allySelectWindow) { return { x: 0, y: 0 }; }

    const spellWindowPos = this.#getSpellSelectWindowPos();
    const { width } = this.ports.screen.getGameSize();
    const spellWindowRightX = spellWindowPos.x + this.#spellSelectWindow.width;
    const overWidth = Math.max((spellWindowRightX + this.#allySelectWindow.width) - width, 0);

    return {
      x: spellWindowRightX - overWidth,
      y: spellWindowPos.y + (this.#spellSelectWindow?.height ?? 0) - (this.#allySelectWindow?.height ?? 0),
    };
  }

  get inputWindowWidth(): number {
    return (this.#commandWindow?.width ?? 0) + (this.#enemySelectWindow?.width ?? 0);
  }
}
