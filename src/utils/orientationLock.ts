export function initPortraitLock(): void {
  if (typeof window === 'undefined') return;

  function attemptPortraitLock() {
    const orientation = (typeof screen !== 'undefined' ? screen.orientation : undefined) as
      | { lock?: (orientation: string) => Promise<void> }
      | undefined;

    if (orientation && typeof orientation.lock === 'function') {
      const lockPromise = orientation.lock('portrait-primary');
      if (lockPromise && typeof lockPromise.catch === 'function') {
        lockPromise.catch(() => {
          orientation.lock?.('portrait').catch(() => {});
        });
      }
    }
  }

  window.addEventListener('load', attemptPortraitLock);
  window.addEventListener('touchstart', attemptPortraitLock, { once: true });
  window.addEventListener('pointerdown', attemptPortraitLock, { once: true });
  window.addEventListener('click', attemptPortraitLock, { once: true });
  window.addEventListener('orientationchange', attemptPortraitLock);
}
