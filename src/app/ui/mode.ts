export const UIMODE = {
  PAD:  "pad",
  BARE: "bare",
} as const;

export type UIMode = typeof UIMODE[keyof typeof UIMODE];

const UIMODES = Object.values(UIMODE);

export function isUIMode(x: unknown): x is UIMode {
  return typeof x === "string" && (UIMODES as readonly string[]).includes(x);
}
