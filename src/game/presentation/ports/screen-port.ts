export type GameSize = {
  width: number;
  height: number;
}

export interface ScreenPort {
  /** 現在の仮想ゲーム画面の内部サイズを返す */
  getGameSize(): GameSize;

  /** 仮想ゲーム画面のサイズが変わった時に通知する */
  onGameSizeChanged(handler: (size: GameSize) => void): () => void;
}
