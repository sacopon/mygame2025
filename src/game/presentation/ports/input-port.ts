export enum GameButton {
  Up, Down, Left, Right, A, B, Start, Select,
}

export interface InputPort {
  /** 現在押されている（レベル） */
  isDown(button: GameButton): boolean;
  /** 今フレームで新規に押された（立ち上がり） */
  pressed(button: GameButton): boolean;
  /** 今フレームで離された（立ち下がり） */
  released(button: GameButton): boolean;

  /** -1..+1 の軸（D-Pad 合成） */
  axisX(): number; // Left:-1, Right:+1
  axisY(): number; // Up:-1, Down:+1

  // 主にデバッグ用
  snapshot(): number;
  snapshotPrev(): number;
}
