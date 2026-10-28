// Injected at build time via vite.config.ts `define`. Not available in test environment
// (vitest) unless separately configured, so consumers should guard with `typeof __APP_VERSION__`.
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
