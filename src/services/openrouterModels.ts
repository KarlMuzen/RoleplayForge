export interface OpenRouterModelItem {
  id: string;
  name: string;
  contextLength?: number;
  promptPricePer1K?: number;
  completionPricePer1K?: number;
  description?: string;
}

interface CachedModelsData {
  timestamp: number;
  models: OpenRouterModelItem[];
}

const CACHE_KEY = 'openrouter_models_cache_v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let memoryCache: CachedModelsData | null = null;

/**
 * Clears in-memory and storage cache (useful for testing and reset)
 */
export function clearOpenRouterModelsCache(): void {
  memoryCache = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Format prompt and completion prices into a readable string ($/1K tokens)
 */
export function formatOpenRouterPricing(promptPrice?: number, completionPrice?: number): string {
  if (promptPrice === undefined && completionPrice === undefined) {
    return 'Pricing unknown';
  }
  const p = promptPrice ?? 0;
  const c = completionPrice ?? 0;
  if (p === 0 && c === 0) {
    return 'Free';
  }

  const formatNum = (num: number) => {
    if (num === 0) return '$0';
    if (num < 0.01) return `$${Number(num.toFixed(6))}`;
    return `$${Number(num.toFixed(4))}`;
  };

  return `In: ${formatNum(p)} · Out: ${formatNum(c)} / 1K`;
}

/**
 * Loads cached models from in-memory cache or localStorage
 */
function getCachedModels(): OpenRouterModelItem[] | null {
  const now = Date.now();

  // 1. Check in-memory cache
  if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.models;
  }

  // 2. Check localStorage cache
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed: CachedModelsData = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.models) && now - parsed.timestamp < CACHE_TTL_MS) {
        memoryCache = parsed;
        return parsed.models;
      }
    }
  } catch {
    // LocalStorage read error ignored
  }

  return null;
}

/**
 * Returns any available cache regardless of expiration (for network fallback)
 */
function getStaleCache(): OpenRouterModelItem[] | null {
  if (memoryCache?.models?.length) return memoryCache.models;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed: CachedModelsData = JSON.parse(raw);
      if (parsed?.models?.length) return parsed.models;
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * Saves models to in-memory and localStorage cache
 */
function saveCachedModels(models: OpenRouterModelItem[]): void {
  const data: CachedModelsData = {
    timestamp: Date.now(),
    models,
  };
  memoryCache = data;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota or disabled storage ignored
  }
}

/**
 * Fetches public models list from OpenRouter API with caching & fallback
 */
export async function fetchOpenRouterModels(forceRefresh = false): Promise<OpenRouterModelItem[]> {
  if (!forceRefresh) {
    const cached = getCachedModels();
    if (cached && cached.length > 0) {
      return cached;
    }
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`OpenRouter API returned HTTP ${res.status}`);
    }

    const json = await res.json();
    const rawList: Array<{
      id?: string;
      name?: string;
      description?: string;
      context_length?: number;
      pricing?: { prompt?: string | number; completion?: string | number };
    }> = json?.data || [];

    const mapped: OpenRouterModelItem[] = rawList
      .map((m) => {
        const id = m.id || '';
        const name = m.name || id;
        const contextLength = typeof m.context_length === 'number' ? m.context_length : undefined;

        let promptPricePer1K: number | undefined;
        let completionPricePer1K: number | undefined;

        if (m.pricing) {
          if (m.pricing.prompt !== undefined && m.pricing.prompt !== null) {
            const rawPrompt = parseFloat(String(m.pricing.prompt));
            if (!isNaN(rawPrompt)) {
              promptPricePer1K = rawPrompt * 1000;
            }
          }
          if (m.pricing.completion !== undefined && m.pricing.completion !== null) {
            const rawComp = parseFloat(String(m.pricing.completion));
            if (!isNaN(rawComp)) {
              completionPricePer1K = rawComp * 1000;
            }
          }
        }

        return {
          id,
          name,
          contextLength,
          promptPricePer1K,
          completionPricePer1K,
          description: typeof m.description === 'string' ? m.description : undefined,
        };
      })
      .filter((m) => Boolean(m.id));

    saveCachedModels(mapped);
    return mapped;
  } catch (err) {
    // If fetch failed, attempt to return stale cached models if available
    const stale = getStaleCache();
    if (stale && stale.length > 0) {
      return stale;
    }
    throw err;
  }
}
