export function toZenkaku(value: number): string {
  // UTF-8
  return String(value).replace(/\d/g, d => String.fromCharCode(d.charCodeAt(0) + 0xFEE0));
}
