export type Insets = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function getSafeAreaInsets(): Insets {
  const probe = document.createElement("div");
  probe.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 0; height: 0;
    padding-left: env(safe-area-inset-left);
    padding-top: env(safe-area-inset-top);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
    pointer-events: none; visibility: hidden;
  `;
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const toNum = (v: string) => (parseFloat(v) || 0);
  const insets = {
    left: toNum(cs.paddingLeft),
    top: toNum(cs.paddingTop),
    right: toNum(cs.paddingRight),
    bottom: toNum(cs.paddingBottom),
  };
  document.body.removeChild(probe);

  return insets;
}
