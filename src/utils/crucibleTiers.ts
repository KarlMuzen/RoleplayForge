export type ResilienceTierId =
  | 'untested'
  | 'vulnerable'
  | 'moderate'
  | 'verified'
  | 'hardened'
  | 'flawless';

export interface ResilienceTier {
  id: ResilienceTierId;
  label: string;
  colorHex: string;
  tailwindTextClass: string;
}

/**
 * Single source of truth for Crucible resilience score tiers and thresholds.
 *
 * Tiers:
 * - null    -> UNTESTED
 * - 0-39    -> VULNERABLE (Red)
 * - 40-69   -> MODERATE DRIFT (Amber)
 * - 70-89   -> RESILIENCE VERIFIED (Emerald)
 * - 90-99   -> BATTLE-HARDENED (Cyan)
 * - 100     -> FLAWLESS VICTORY (Gold)
 */
export function getResilienceTier(rate: number | null): ResilienceTier {
  if (rate === null || typeof rate !== 'number' || isNaN(rate)) {
    return {
      id: 'untested',
      label: 'UNTESTED',
      colorHex: '#a1a1aa',
      tailwindTextClass: 'text-knight-400',
    };
  }

  if (rate < 40) {
    return {
      id: 'vulnerable',
      label: 'VULNERABLE',
      colorHex: '#f43f5e',
      tailwindTextClass: 'text-rose-500',
    };
  }

  if (rate < 70) {
    return {
      id: 'moderate',
      label: 'MODERATE DRIFT',
      colorHex: '#f59e0b',
      tailwindTextClass: 'text-amber-400',
    };
  }

  if (rate < 90) {
    return {
      id: 'verified',
      label: 'RESILIENCE VERIFIED',
      colorHex: '#10b981',
      tailwindTextClass: 'text-emerald-400',
    };
  }

  if (rate < 100) {
    return {
      id: 'hardened',
      label: 'BATTLE-HARDENED',
      colorHex: '#06b6d4',
      tailwindTextClass: 'text-cyan-400',
    };
  }

  return {
    id: 'flawless',
    label: 'FLAWLESS VICTORY',
    colorHex: '#facc15',
    tailwindTextClass: 'text-yellow-300',
  };
}
