import { describe, it, expect } from 'vitest';
import {
  calculateModelCost,
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_OPENROUTER_MODEL,
  MODEL_PRICING_PER_1K,
} from '../src/constants/models';
import type { ConnectionProfile } from '../src/db';

describe('Pricing and calculateModelCost', () => {
  it('has updated model constants and pricing rates', () => {
    expect(DEFAULT_ANTHROPIC_MODEL).toBe('claude-sonnet-5');
    expect(DEFAULT_OPENAI_MODEL).toBe('gpt-5.6-terra');
    expect(DEFAULT_GEMINI_MODEL).toBe('gemini-3.6-flash');
    expect(DEFAULT_OPENROUTER_MODEL).toBe('deepseek/deepseek-r1');

    expect(MODEL_PRICING_PER_1K['claude-sonnet-5']).toEqual({ prompt: 0.002, completion: 0.010 });
    expect(MODEL_PRICING_PER_1K['claude-opus-5']).toEqual({ prompt: 0.005, completion: 0.025 });
    expect(MODEL_PRICING_PER_1K['claude-haiku-4-5-20251001']).toEqual({ prompt: 0.001, completion: 0.005 });
    expect(MODEL_PRICING_PER_1K['gpt-5.6-sol']).toEqual({ prompt: 0.005, completion: 0.030 });
    expect(MODEL_PRICING_PER_1K['gpt-5.6-terra']).toEqual({ prompt: 0.002, completion: 0.012 });
    expect(MODEL_PRICING_PER_1K['gpt-5.6-luna']).toEqual({ prompt: 0.0002, completion: 0.0012 });
    expect(MODEL_PRICING_PER_1K['gemini-3.1-pro']).toEqual({ prompt: 0.002, completion: 0.012 });
    expect(MODEL_PRICING_PER_1K['gemini-3.6-flash']).toEqual({ prompt: 0.0015, completion: 0.0075 });
  });

  it('calculates cost accurately using standard model pricing table', () => {
    // 1000 prompt tokens + 1000 completion tokens for claude-sonnet-5 = $0.002 + $0.010 = $0.012
    const cost = calculateModelCost('claude-sonnet-5', 1000, 1000);
    expect(cost).toBeCloseTo(0.012, 6);
  });

  it('uses custom pricing overrides when provided on connection profile', () => {
    const profile: Partial<ConnectionProfile> = {
      customPromptPricePer1K: 0.004,
      customCompletionPricePer1K: 0.020,
    };

    // 1000 prompt tokens ($0.004) + 1000 completion tokens ($0.020) = $0.024
    const cost = calculateModelCost('claude-sonnet-5', 1000, 1000, profile);
    expect(cost).toBeCloseTo(0.024, 6);
  });

  it('handles partial pricing overrides and zero prices', () => {
    // Only prompt override
    const promptOnlyProfile: Partial<ConnectionProfile> = {
      customPromptPricePer1K: 0.005,
    };
    // 1000 prompt ($0.005) + 1000 completion ($0.010 from table) = $0.015
    const costPromptOnly = calculateModelCost('claude-sonnet-5', 1000, 1000, promptOnlyProfile);
    expect(costPromptOnly).toBeCloseTo(0.015, 6);

    // Free tier / 0 override
    const freeProfile: Partial<ConnectionProfile> = {
      customPromptPricePer1K: 0,
      customCompletionPricePer1K: 0,
    };
    const freeCost = calculateModelCost('claude-sonnet-5', 10000, 10000, freeProfile);
    expect(freeCost).toBe(0);
  });

  it('falls back to fuzzy matching table when no custom overrides are set', () => {
    const defaultProfile: Partial<ConnectionProfile> = {
      name: 'Default',
    };
    const cost = calculateModelCost('gemini-3.6-flash', 2000, 2000, defaultProfile);
    // 2 * 0.0015 + 2 * 0.0075 = 0.003 + 0.015 = 0.018
    expect(cost).toBeCloseTo(0.018, 6);
  });
});
