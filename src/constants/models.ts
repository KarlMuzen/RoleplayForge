import type { ConnectionProfile } from '../db';

export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-5';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
export const DEFAULT_OPENAI_MODEL = 'gpt-5.6-terra';
export const DEFAULT_OPENROUTER_MODEL = 'deepseek/deepseek-r1';
export const DEFAULT_OLLAMA_MODEL = 'llama3.2';

/**
 * Hardcoded rates per 1,000 tokens ($/1K) for common model families.
 * Rates represented as { prompt: $/1k, completion: $/1k }.
 */
export const MODEL_PRICING_PER_1K: Record<string, { prompt: number; completion: number }> = {
  // Anthropic Claude
  'claude-sonnet-5': { prompt: 0.002, completion: 0.010 }, // introductory rate through Aug 31 2026, reverts to 0.003/0.015 after
  'claude-opus-5': { prompt: 0.005, completion: 0.025 },
  'claude-haiku-4-5-20251001': { prompt: 0.001, completion: 0.005 },
  'claude-3-5-haiku': { prompt: 0.0008, completion: 0.004 },
  'claude-3-opus': { prompt: 0.015, completion: 0.075 },

  // Google Gemini
  'gemini-3.6-flash': { prompt: 0.0015, completion: 0.0075 },
  'gemini-3.1-pro': { prompt: 0.002, completion: 0.012 },
  'gemini-2.5-pro': { prompt: 0.00125, completion: 0.005 },
  'gemini-1.5-pro': { prompt: 0.00125, completion: 0.005 },

  // OpenAI
  'gpt-5.6-sol': { prompt: 0.005, completion: 0.030 },
  'gpt-5.6-terra': { prompt: 0.002, completion: 0.012 },
  'gpt-5.6-luna': { prompt: 0.0002, completion: 0.0012 },
  'gpt-4.5-preview': { prompt: 0.075, completion: 0.15 },
  'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
  'o1': { prompt: 0.015, completion: 0.06 },
  'o1-mini': { prompt: 0.0011, completion: 0.0044 },
  'o3-mini': { prompt: 0.0011, completion: 0.0044 },

  // OpenRouter & Open Models
  'deepseek/deepseek-r1': { prompt: 0.00055, completion: 0.00219 },
  'deepseek/deepseek-chat': { prompt: 0.00014, completion: 0.00028 },
  'meta-llama/llama-3.3-70b-instruct': { prompt: 0.00012, completion: 0.0003 },
  'meta-llama/llama-3.1-8b-instruct': { prompt: 0.00005, completion: 0.00005 },
  'mistralai/mistral-large-2411': { prompt: 0.002, completion: 0.006 },

  // Local / Self-hosted
  'llama3.2': { prompt: 0, completion: 0 },
  'llama3.3': { prompt: 0, completion: 0 },
  'qwen2.5': { prompt: 0, completion: 0 },
};

export function calculateModelCost(
  modelName: string,
  promptTokens: number,
  completionTokens: number,
  profile?: Partial<ConnectionProfile> | { customPromptPricePer1K?: number; customCompletionPricePer1K?: number } | null
): number {
  if (!modelName && profile?.customPromptPricePer1K === undefined && profile?.customCompletionPricePer1K === undefined) {
    return 0;
  }
  const lower = (modelName || '').toLowerCase();

  const customPrompt =
    typeof profile?.customPromptPricePer1K === 'number' && !isNaN(profile.customPromptPricePer1K)
      ? profile.customPromptPricePer1K
      : undefined;

  const customCompletion =
    typeof profile?.customCompletionPricePer1K === 'number' && !isNaN(profile.customCompletionPricePer1K)
      ? profile.customCompletionPricePer1K
      : undefined;

  let pricing = MODEL_PRICING_PER_1K[modelName];
  if (!pricing) {
    for (const [key, val] of Object.entries(MODEL_PRICING_PER_1K)) {
      if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
        pricing = val;
        break;
      }
    }
  }

  if (!pricing) {
    if (lower.includes('claude') || lower.includes('gpt-4')) {
      pricing = { prompt: 0.0025, completion: 0.01 };
    } else if (lower.includes('mini') || lower.includes('flash') || lower.includes('haiku')) {
      pricing = { prompt: 0.00015, completion: 0.0006 };
    } else if (lower.includes('ollama') || lower.includes('local')) {
      pricing = { prompt: 0, completion: 0 };
    } else {
      pricing = { prompt: 0.001, completion: 0.002 };
    }
  }

  const promptPrice = customPrompt !== undefined ? customPrompt : pricing.prompt;
  const completionPrice = customCompletion !== undefined ? customCompletion : pricing.completion;

  const promptCost = (promptTokens / 1000) * promptPrice;
  const completionCost = (completionTokens / 1000) * completionPrice;
  return promptCost + completionCost;
}

