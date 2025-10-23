/**
 * RequestAnimatinFrame で指定のミリ秒待つ
 */
export async function waitByRAF(waitMs: number): Promise<void> {
  const started = performance.now();

  return await new Promise<void>(resolve => {
    const tick = () => {
      if (waitMs < performance.now() - started) {
        return resolve();
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
};
