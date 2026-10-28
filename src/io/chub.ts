import { importCardData, type ImportResult } from './index';

/**
 * Parses and extracts the Chub path or ID from various URL formats or raw path inputs.
 * Supported formats:
 * - https://chub.ai/characters/username/cardname
 * - https://chub.ai/characters/12345
 * - https://characterhub.org/characters/username/cardname
 * - username/cardname
 * - 12345
 */
export function parseChubInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Handle full URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const pathname = url.pathname.replace(/^\/+|\/+$/g, '');
      const parts = pathname.split('/');
      // e.g. ["characters", "author", "card"] or ["characters", "12345"]
      if (parts[0] === 'characters' && parts.length >= 2) {
        return parts.slice(1).join('/');
      }
      if (parts.length >= 2) {
        return parts.join('/');
      }
      if (parts.length === 1) {
        return parts[0];
      }
    } catch {
      // Fallback to manual regex if URL parsing fails
    }
  }

  // Regex fallback for url/path patterns
  const match = trimmed.match(/(?:characters\/)?([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+)$/);
  if (match) {
    return match[1];
  }

  return trimmed;
}

/**
 * Imports a character card directly from chub.ai given a URL or character ID/path.
 */
export async function importChubCard(input: string): Promise<ImportResult> {
  const chubPath = parseChubInput(input);
  if (!chubPath) {
    throw new Error('Invalid Chub URL or Character ID.');
  }

  // 1. Try fetching character PNG image from Chub's avatar CDN
  const cdnPngUrl = `https://avatars.charhub.io/avatars/${chubPath}/chara_card_v2.png`;
  try {
    const pngRes = await fetch(cdnPngUrl);
    if (pngRes.ok) {
      const arrayBuf = await pngRes.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      const result = await importCardData(bytes, `chub_${chubPath.replace('/', '_')}.png`);
      if (result.card) {
        return result;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Chub CDN PNG directly, trying Chub API JSON endpoint:', err);
  }

  // 2. Try fetching definition from Chub API
  const apiUrl = `https://api.chub.ai/api/characters/${chubPath}?full=true`;
  const apiRes = await fetch(apiUrl);
  if (!apiRes.ok) {
    throw new Error(`Failed to fetch card from Chub.ai (HTTP ${apiRes.status}). Please verify the character URL or ID.`);
  }

  const json = await apiRes.json();
  const node = json?.node || json;

  let rawCardPayload = node?.definition || node?.card || node;
  
  if (typeof rawCardPayload === 'string') {
    try {
      rawCardPayload = JSON.parse(rawCardPayload);
    } catch {
      // ignore
    }
  }

  // Merge extra Chub metadata into extensions if present
  if (rawCardPayload && typeof rawCardPayload === 'object') {
    if (!rawCardPayload.data) {
      rawCardPayload = {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: rawCardPayload,
      };
    }
    if (rawCardPayload.data) {
      if (!rawCardPayload.data.extensions) {
        rawCardPayload.data.extensions = {};
      }
      rawCardPayload.data.extensions.chub = {
        fullPath: chubPath,
        id: node?.id || rawCardPayload.data.extensions?.chub?.id,
        topics: node?.topics || [],
        rating: node?.rating || node?.definition?.rating || 'unrated',
      };
      
      // Preserve chub tags if card tags are empty
      if ((!rawCardPayload.data.tags || rawCardPayload.data.tags.length === 0) && Array.isArray(node?.topics)) {
        rawCardPayload.data.tags = node.topics;
      }
    }
  }

  const jsonBytes = new TextEncoder().encode(JSON.stringify(rawCardPayload));
  return await importCardData(jsonBytes, `chub_${chubPath.replace('/', '_')}.json`);
}
