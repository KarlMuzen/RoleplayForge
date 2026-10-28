import { describe, it, expect } from 'vitest';
import { getResilienceTier } from '../src/utils/crucibleTiers';

describe('crucibleTiers - getResilienceTier', () => {
  it('handles null / undefined / NaN as untested', () => {
    const nullTier = getResilienceTier(null);
    expect(nullTier.id).toBe('untested');
    expect(nullTier.label).toBe('UNTESTED');
    expect(nullTier.tailwindTextClass).toContain('text-knight-400');

    expect(getResilienceTier(undefined as unknown as number).id).toBe('untested');
    expect(getResilienceTier(NaN).id).toBe('untested');
  });

  it('handles 0-39 as vulnerable tier', () => {
    const at0 = getResilienceTier(0);
    expect(at0.id).toBe('vulnerable');
    expect(at0.label).toBe('VULNERABLE');
    expect(at0.colorHex).toBe('#f43f5e');
    expect(at0.tailwindTextClass).toContain('text-rose-500');

    const at39 = getResilienceTier(39);
    expect(at39.id).toBe('vulnerable');
    expect(at39.label).toBe('VULNERABLE');
  });

  it('handles 40-69 as moderate drift tier', () => {
    const at40 = getResilienceTier(40);
    expect(at40.id).toBe('moderate');
    expect(at40.label).toBe('MODERATE DRIFT');
    expect(at40.colorHex).toBe('#f59e0b');
    expect(at40.tailwindTextClass).toContain('text-amber-400');

    const at69 = getResilienceTier(69);
    expect(at69.id).toBe('moderate');
    expect(at69.label).toBe('MODERATE DRIFT');
  });

  it('handles 70-89 as verified tier', () => {
    const at70 = getResilienceTier(70);
    expect(at70.id).toBe('verified');
    expect(at70.label).toBe('RESILIENCE VERIFIED');
    expect(at70.colorHex).toBe('#10b981');
    expect(at70.tailwindTextClass).toContain('text-emerald-400');

    const at89 = getResilienceTier(89);
    expect(at89.id).toBe('verified');
    expect(at89.label).toBe('RESILIENCE VERIFIED');
  });

  it('handles 90-99 as battle-hardened tier', () => {
    const at90 = getResilienceTier(90);
    expect(at90.id).toBe('hardened');
    expect(at90.label).toBe('BATTLE-HARDENED');
    expect(at90.colorHex).toBe('#06b6d4');
    expect(at90.tailwindTextClass).toContain('text-cyan-400');

    const at99 = getResilienceTier(99);
    expect(at99.id).toBe('hardened');
    expect(at99.label).toBe('BATTLE-HARDENED');
  });

  it('handles 100 as flawless victory tier', () => {
    const at100 = getResilienceTier(100);
    expect(at100.id).toBe('flawless');
    expect(at100.label).toBe('FLAWLESS VICTORY');
    expect(at100.colorHex).toBe('#facc15');
    expect(at100.tailwindTextClass).toContain('text-yellow-300');
  });
});
