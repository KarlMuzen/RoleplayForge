/**
 * Build/version info, injected at build time via vite.config.ts `define`.
 * Exists so testers can report exactly which build they hit a bug on, and so
 * crash reports (ErrorBoundary) are self-describing when copied out.
 */

function safeVersion(): string {
  try {
    return typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown';
  } catch {
    return 'unknown';
  }
}

function safeBuildTime(): string {
  try {
    return typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown';
  } catch {
    return 'unknown';
  }
}

export const APP_VERSION = safeVersion();
export const APP_BUILD_TIME = safeBuildTime();

/** Short human label, e.g. "v0.3.0 · built 2026-08-18 14:32 UTC" */
export function getBuildLabel(): string {
  let builtAt = APP_BUILD_TIME;
  if (builtAt !== 'unknown') {
    try {
      const d = new Date(builtAt);
      builtAt = `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
    } catch {
      // keep raw string
    }
  }
  return `v${APP_VERSION} · built ${builtAt}`;
}
