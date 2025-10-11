/**
 * 値が網羅できていない場合のアサーション
 */
export function assertNever(x: never): never {
  throw new Error(`unexpected value: ${x}`);
}
