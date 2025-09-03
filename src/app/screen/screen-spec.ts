export type GameScreen = { WIDTH: number; HEIGHT: number };

// 既存の固定値（従来の 256x224）
export const DefaultScreen: GameScreen = { WIDTH: 256, HEIGHT: 224 };

let _current: GameScreen = DefaultScreen;

// ゲーム側が購読するイベント
export const ScreenEvents = new EventTarget();

export const GameScreenSpec = {
  get current(): GameScreen { return _current; },
  set(v: GameScreen) { _current = v; },
  update(next: GameScreen) {
    if (_current.WIDTH === next.WIDTH && _current.HEIGHT === next.HEIGHT) {
      return;
    }

    _current = next;
    ScreenEvents.dispatchEvent(new CustomEvent("virtualscreenchange", { detail: next }));
    return true;
  }
};

// bare landscape 用：16:10 の仮想解像度を計算
export function computeBareVirtualScreen(
  viewW: number,
  viewH: number,
  baseShortEdge = DefaultScreen.HEIGHT,  // 高さを既存の短辺に合わせるのが安全
  aspect = 16 / 10,
  grid = 8                                // ドット絵なら 8/16 で丸めると綺麗
): GameScreen {
  if (viewW >= viewH) {
    const HEIGHT = baseShortEdge;
    let WIDTH = Math.round(HEIGHT * aspect);
    if (grid > 1) WIDTH = Math.round(WIDTH / grid) * grid;
    return { WIDTH, HEIGHT };
  }
  // portrait は従来どおり
  return DefaultScreen;
}
