/**
 * 配列インデックスをループさせる（負の値や length 超えを正規化）
 *
 * @param index 元のインデックス
 * @param length 配列長
 * @returns ループ後のインデックス
 */
export function wrapIndex(index: number, length: number): number {
  if (0 <= index && index < length) {
    return index;
  }

  if (length === 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}
