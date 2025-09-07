import { UIMODE, UIMode } from "@app/features/ui/mode";
import { GameScreen } from "@app/services/screen";
import { Skin } from "@app/features/ui/skin";

export type ViewRect = {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ViewSize = {
  width: number;
  height: number;
}

export type ViewportMetricsState = {
  view: ViewSize;
  screen: ViewRect;
  virtual: ViewSize;
  scale: number;
  mode: UIMode;
}

export const VIEWPORT_METRICS_CHANGED = "viewport-metrics:changed";

function compareViewMetricsState(a: ViewportMetricsState, b: ViewportMetricsState): boolean {
  return a.view.width === b.view.width
    && a.view.height === b.view.height
    && a.screen.x === b.screen.x
    && a.screen.y === b.screen.y
    && a.screen.width === b.screen.width
    && a.screen.height === b.screen.height
    && a.virtual.width === b.virtual.width
    && a.virtual.height === b.virtual.height
    && a.scale === b.scale
    && a.mode === b.mode;
}

/**
 * ViewportMetrics は「実際のブラウザ表示領域」と「仮想ゲーム画面」の対応関係を管理するクラスです.
 *
 * - `view`: 実ウィンドウのサイズ（px）
 * - `screen`: 実ウィンドウ内に投影される仮想ゲーム画面の矩形（px）
 * - `scale`: 仮想解像度から実ウィンドウへ拡大縮小する倍率
 * - `mode`: 表示モード（PAD / BARE など）
 *
 * `update()` が呼ばれると内部状態を更新し、前回から値が変わっていれば
 * {@link VIEWPORT_METRICS_CHANGED} イベントを発火します。
 * 
 * ゲームロジックやカメラ、UI レイアウトなどはこのクラスを購読することで
 * 画面リサイズやモード切替に追従できます。
 *
 * 典型的な利用例:
 * ```ts
 * ctx.viewport.addEventListener(VIEWPORT_METRICS_CHANGED, (ev) => {
 *   const m = (ev as CustomEvent<ViewportMetricsState>).detail;
 *   // m.screen / m.scale を使ってレイアウト更新
 * });
 *
 * const current = ctx.viewport.current; // 直近の値を即座に参照可能
 * ```
 */
export class ViewportMetrics extends EventTarget {
  #current: ViewportMetricsState | null = null;

  public get current(): ViewportMetricsState {
    if (!this.#current) {
      throw new Error("ViewportMetrics not initialized.");
    }

    return this.#current;
  }

  public update(next: ViewportMetricsState) {
    const prev = this.#current;
    const changed = !prev || !compareViewMetricsState(prev, next);
    this.#current = next;

    if (changed) {
      this.dispatchEvent(new CustomEvent(VIEWPORT_METRICS_CHANGED, { detail: next }));
    }
  }
}

export function computeViewMetrics(
  mode: UIMode,
  width: number,
  height: number,
  virtual: GameScreen,
  padSkin?: Skin
) : ViewportMetricsState {
  const vw = virtual.width;
  const vh = virtual.height;
  const scale = mode === UIMODE.PAD ?
    (padSkin!.screen.size.width / vw) : // PAD: スキン定義の仮想画面幅にフィット
    Math.min(width / vw, height / vh);           // BARE: 短辺フィット(丸めない)

  const screenW = vw * scale;
  const screenH = vh * scale;
  const screenX = (width  - screenW) / 2;
  const screenY = (height - screenH) / 2;

  return {
    view:   {
      width,
      height,
    },
    screen: {
      x: Math.round(screenX),
      y: Math.round(screenY),
      width: Math.round(screenW),
      height: Math.round(screenH),
    },
    virtual: {
      width: vw,
      height: vh,
    },
    scale,
    mode,
  };
}