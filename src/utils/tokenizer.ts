import { GoogleGenAI } from '@google/genai';
import { encode } from 'gpt-tokenizer';
import type { ConnectionProfile } from '../db';
import { useCardStore } from '../store/useCardStore';
import { DEFAULT_ANTHROPIC_MODEL, DEFAULT_GEMINI_MODEL } from '../constants/models';

// In-memory token cache to prevent duplicate API calls & allow synchronous access once resolved
const tokenCache = new Map<string, number>();
const MAX_TOKEN_CACHE_SIZE = 1000;

function setTokenCache(key: string, val: number): void {
  if (tokenCache.size >= MAX_TOKEN_CACHE_SIZE) {
    const firstKey = tokenCache.keys().next().value;
    if (firstKey !== undefined) {
      tokenCache.delete(firstKey);
    }
  }
  tokenCache.set(key, val);
}

function getCacheKey(text: string, provider: string, model?: string): string {
  return `${provider}:${model || ''}:${text}`;
}

/**
 * Counts tokens based on the selected provider schema.
 * - openai/openrouter: gpt-tokenizer (cl100k_base standard approximation).
 * - anthropic: 1 token ≈ 3.5 characters (fallback).
 * - google/gemini/ollama: 1 token ≈ 4 characters (fallback).
 * Strips CCv3 decorators (@@...) and comment macros ({{// ...}}) if requested.
 */
export function countTokens(
  text: string,
  stripDecorators = false,
  provider = 'openai',
  model?: string
): number {
  if (!text) return 0;

  let processedText = text;
  if (stripDecorators) {
    // Strip @@decorator lines
    processedText = processedText.replace(/^@@@?[\w_]+.*$/gm, '');
    // Strip comment macros {{// ...}} and {{comment: ...}}
    processedText = processedText.replace(/\{\{\/\/[\s\S]*?\}\}/g, '');
    processedText = processedText.replace(/\{\{comment:[\s\S]*?\}\}/g, '');
  }

  const cacheKey = getCacheKey(processedText, provider, model);
  if (tokenCache.has(cacheKey)) {
    return tokenCache.get(cacheKey)!;
  }

  let count = 0;
  try {
    if (provider === 'anthropic') {
      count = Math.ceil(processedText.length / 3.5);
    } else if (provider === 'google' || provider === 'gemini' || provider === 'ollama') {
      count = Math.ceil(processedText.length / 4);
    } else {
      // Default to OpenAI / cl100k_base
      const tokens = encode(processedText);
      count = tokens.length;
    }
  } catch {
    // Fallback word/char heuristic if encoding fails
    count = Math.ceil(processedText.length / 4);
  }

  setTokenCache(cacheKey, count);
  return count;
}

/**
 * Asynchronously calculates token count for provider endpoints when a connection is live.
 * For Anthropic: calls POST /v1/messages/count_tokens
 * For Gemini: uses @google/genai countTokens SDK method
 * Falls back to ratio estimates if offline or if API call fails.
 */
export async function countTokensAsync(
  text: string,
  stripDecorators = false,
  profileOrProvider?: ConnectionProfile | string,
  explicitApiKey?: string
): Promise<number> {
  if (!text) return 0;

  let processedText = text;
  if (stripDecorators) {
    processedText = processedText.replace(/^@@@?[\w_]+.*$/gm, '');
    processedText = processedText.replace(/\{\{\/\/[\s\S]*?\}\}/g, '');
    processedText = processedText.replace(/\{\{comment:[\s\S]*?\}\}/g, '');
  }

  let provider = 'openai';
  let model: string | undefined = undefined;
  let profile: ConnectionProfile | undefined = undefined;

  if (typeof profileOrProvider === 'object' && profileOrProvider !== null) {
    profile = profileOrProvider;
    provider = profile.provider || 'openai';
    model = profile.model;
  } else if (typeof profileOrProvider === 'string') {
    provider = profileOrProvider;
  }

  const cacheKey = getCacheKey(processedText, provider, model);
  if (tokenCache.has(cacheKey)) {
    return tokenCache.get(cacheKey)!;
  }

  let apiKey = explicitApiKey || (profile?.apiKey?.startsWith('enc.v1.') ? undefined : profile?.apiKey);
  if (!apiKey && profile) {
    try {
      const decrypted = await useCardStore.getState().getDecryptedApiKey(profile, false);
      if (decrypted) apiKey = decrypted;
    } catch {
      // Ignore decryption failure; fallback to heuristic
    }
  }

  // 1. Anthropic count_tokens endpoint
  if (provider === 'anthropic') {
    if (apiKey) {
      try {
        const anthropicModel = model || DEFAULT_ANTHROPIC_MODEL;
        const res = await fetch('https://api.anthropic.com/v1/messages/count_tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: anthropicModel,
            messages: [{ role: 'user', content: processedText }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (typeof data.input_tokens === 'number') {
            setTokenCache(cacheKey, data.input_tokens);
            return data.input_tokens;
          }
        }
      } catch (err) {
        console.warn('Anthropic count_tokens API call failed, using estimate fallback:', err);
      }
    }
  }

  // 2. Gemini countTokens SDK
  if (provider === 'google' || provider === 'gemini') {
    if (apiKey) {
      try {
        const geminiModel = model || DEFAULT_GEMINI_MODEL;
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.countTokens({
          model: geminiModel,
          contents: processedText,
        });
        if (typeof response.totalTokens === 'number') {
          setTokenCache(cacheKey, response.totalTokens);
          return response.totalTokens;
        }
      } catch (err) {
        console.warn('Gemini countTokens SDK call failed, using estimate fallback:', err);
      }
    }
  }

  // Synchronous fallback (gpt-tokenizer for OpenAI or char ratio for Anthropic/Gemini/Ollama)
  const fallback = countTokens(text, stripDecorators, provider, model);
  setTokenCache(cacheKey, fallback);
  return fallback;
}

export function getTokenSchemeName(provider?: string): string {
  if (!provider) return 'OpenAI Tokens';
  if (provider === 'anthropic') return 'Claude Tokens';
  if (provider === 'google' || provider === 'gemini') return 'Gemini Tokens';
  if (provider === 'ollama') return 'Est. Llama Tokens';
  return 'OpenAI Tokens';
}
