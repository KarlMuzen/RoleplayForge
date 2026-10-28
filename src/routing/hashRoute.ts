import type { TabType } from '../store/useCardStore';

/**
 * Hash-based routes. Hash routing needs no hosting rewrite (the Vercel project
 * has none, so path URLs such as /studio/x would 404 on refresh).
 *
 *   #/library
 *   #/forge[/<cardUuid>[/details|lorebook|prompt|assist]]
 *   #/test[/<cardUuid>[/stress|enhancer]]
 *   #/settings
 */
export interface Route {
  tab: TabType;
  /** null means "do not change the active card". */
  cardUuid: string | null;
}

export type Section = 'library' | 'forge' | 'test' | 'settings';

const FORGE_SEGMENTS: Record<string, TabType> = {
  details: 'editor',
  lorebook: 'lorebook',
  prompt: 'payload',
  assist: 'assistant',
};
const TEST_SEGMENTS: Record<string, TabType> = {
  stress: 'crucible',
  enhancer: 'enhancer',
};

const invert = (m: Record<string, TabType>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<string, string>;
const FORGE_BY_TAB = invert(FORGE_SEGMENTS);
const TEST_BY_TAB = invert(TEST_SEGMENTS);

const UUID_RE = /^[A-Za-z0-9._-]{1,128}$/;

export function sectionOf(tab: TabType): Section {
  if (tab === 'gallery') return 'library';
  if (tab === 'settings') return 'settings';
  if (tab in TEST_BY_TAB) return 'test';
  return 'forge';
}

/** Returns null for an empty or unrecognised hash. */
export function parseHash(hash: string): Route | null {
  const parts = hash.replace(/^#/, '').split('/').filter(Boolean);
  if (parts.length === 0) return null;
  const [head, uuid, seg, ...rest] = parts;
  if (rest.length > 0) return null;

  if (head === 'library') return parts.length === 1 ? { tab: 'gallery', cardUuid: null } : null;
  if (head === 'settings') return parts.length === 1 ? { tab: 'settings', cardUuid: null } : null;

  if (head === 'forge' || head === 'test') {
    if (uuid !== undefined && !UUID_RE.test(uuid)) return null;
    const table = head === 'forge' ? FORGE_SEGMENTS : TEST_SEGMENTS;
    const fallback: TabType = head === 'forge' ? 'editor' : 'crucible';
    if (seg !== undefined && !(seg in table)) return null;
    return { tab: seg !== undefined ? table[seg] : fallback, cardUuid: uuid ?? null };
  }
  return null;
}

export function serializeRoute(route: Route): string {
  const section = sectionOf(route.tab);
  if (section === 'library') return '#/library';
  if (section === 'settings') return '#/settings';
  const base = section === 'forge' ? '#/forge' : '#/test';
  if (!route.cardUuid) return base;
  const seg = section === 'forge' ? FORGE_BY_TAB[route.tab] : TEST_BY_TAB[route.tab];
  return `${base}/${route.cardUuid}/${seg}`;
}
