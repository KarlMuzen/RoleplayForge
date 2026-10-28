import { describe, it, expect } from 'vitest';
import { parseHash, serializeRoute, sectionOf } from '../src/routing/hashRoute';
import type { TabType } from '../src/store/useCardStore';

describe('hash routes', () => {
  it('parses the base routes', () => {
    expect(parseHash('#/library')).toEqual({ tab: 'gallery', cardUuid: null });
    expect(parseHash('#/settings')).toEqual({ tab: 'settings', cardUuid: null });
    expect(parseHash('#/forge')).toEqual({ tab: 'editor', cardUuid: null });
    expect(parseHash('#/test')).toEqual({ tab: 'crucible', cardUuid: null });
  });

  it('parses card and sub-tab segments', () => {
    expect(parseHash('#/forge/abc-123/lorebook')).toEqual({ tab: 'lorebook', cardUuid: 'abc-123' });
    expect(parseHash('#/forge/abc-123')).toEqual({ tab: 'editor', cardUuid: 'abc-123' });
    expect(parseHash('#/test/abc-123/enhancer')).toEqual({ tab: 'enhancer', cardUuid: 'abc-123' });
  });

  it('rejects empty, unknown, malformed and over-long routes', () => {
    for (const h of ['', '#', '#/', '#/nope', '#/forge/abc/unknown', '#/library/x', '#/forge/a/b/c', '#/forge/has space/details', '#/forge/' + 'x'.repeat(200)]) {
      expect(parseHash(h)).toBeNull();
    }
  });

  it('round-trips every tab with a card', () => {
    const tabs: TabType[] = ['gallery', 'editor', 'lorebook', 'payload', 'assistant', 'crucible', 'enhancer', 'settings'];
    for (const tab of tabs) {
      const hash = serializeRoute({ tab, cardUuid: 'card-1' });
      const parsed = parseHash(hash)!;
      expect(parsed.tab).toBe(tab);
      expect(parsed.cardUuid).toBe(sectionOf(tab) === 'forge' || sectionOf(tab) === 'test' ? 'card-1' : null);
    }
  });

  it('drops the sub-tab when there is no active card', () => {
    expect(serializeRoute({ tab: 'lorebook', cardUuid: null })).toBe('#/forge');
  });
});
