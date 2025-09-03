export type GameScreen = { width: number; height: number };

// 既存の固定値（従来の 256x224）
export const DefaultScreen: GameScreen = { width: 256, height: 224 };

// 文字列の打ち間違いを防ぐための定数
export const VIRTUAL_SCREEN_CHANGE = "virtualscreenchange" as const;
export type VirtualScreenChangeEvent = CustomEvent<GameScreen>;

export class GameScreenSpec extends EventTarget
{
  private _current: GameScreen;

  public constructor(initial = DefaultScreen) {
    super();
    this._current = initial;
  }

  get current(): GameScreen {
    return this._current;
  }

  setCurrent(v: GameScreen) {
    this._current = v;
  }

  update(next: GameScreen) {
    if (this._current.width === next.width && this._current.width === next.width) {
      return;
    }

    this._current = next;
    console.log(`next:${next}`);
    this.dispatchEvent(new CustomEvent<GameScreen>(VIRTUAL_SCREEN_CHANGE, { detail: next }));
    return true;
  }

  // bare landscape 用：16:10 の仮想解像度を計算
  static computeBareVirtualScreen(
    viewW: number,
    viewH: number,
    baseShortEdge = DefaultScreen.height,  // 高さを既存の短辺に合わせるのが安全
    aspect = 16 / 10,
    grid = 8                               // ドット絵なら 8/16 で丸めると綺麗
  ): GameScreen {
    if (viewW >= viewH) {
      const height = baseShortEdge;
      let width = Math.round(height * aspect);

      if (grid > 1) {
        width = Math.round(width / grid) * grid;
      }

      return { width, height };
    }

    // portrait は従来どおり
    return DefaultScreen;
  }
};
