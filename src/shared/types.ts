export type Size = {
  width: number;
  height: number;
}

export type Position = {
  x: number;
  y: number;
}

export const PAD_BIT = {
  DPAD_UP: 0,
  DPAD_DOWN: 1,
  DPAD_LEFT: 2,
  DPAD_RIGHT: 3,
  BUTTON1: 4,
  BUTTON2: 5,
  BUTTON3: 6,
  BUTTON4: 7,
};

// Type Branding パターン（擬似 Nominal Type）.
// ブランド型.
// 構造は number だが、型レベルでは別のID と区別される.
// 識別子など、Map のキーとして使用するようなものはこれを使用する.
export type Brand<T, B extends string> = T & { readonly __brand: B };
