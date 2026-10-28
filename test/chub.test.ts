import { describe, it, expect, vi } from 'vitest';
import { parseChubInput, importChubCard } from '../src/io/chub';

describe('chub import', () => {
  it('correctly parses various Chub URL and ID formats', () => {
    expect(parseChubInput('https://chub.ai/characters/authorName/cardName')).toBe('authorName/cardName');
    expect(parseChubInput('https://chub.ai/characters/12345')).toBe('12345');
    expect(parseChubInput('https://characterhub.org/characters/authorName/cardName')).toBe('authorName/cardName');
    expect(parseChubInput('authorName/cardName')).toBe('authorName/cardName');
    expect(parseChubInput('12345')).toBe('12345');
  });

  it('imports card definition when Chub API responds with valid character node', async () => {
    const mockFetch = vi.fn(async (url: string) => {
      if (url.includes('avatars.charhub.io')) {
        return { ok: false, status: 404 } as Response;
      }
      if (url.includes('api.chub.ai')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            node: {
              id: 999,
              topics: ['fantasy', 'magic'],
              definition: {
                spec: 'chara_card_v2',
                spec_version: '2.0',
                data: {
                  name: 'Chub Mage',
                  description: 'A powerful mage from chub.ai',
                  personality: 'Wise',
                  first_mes: 'Greetings traveler.',
                },
              },
            },
          }),
        } as Response;
      }
      return { ok: false, status: 400 } as Response;
    });

    vi.stubGlobal('fetch', mockFetch);

    const result = await importChubCard('https://chub.ai/characters/test/mage');
    expect(result.card).toBeDefined();
    expect(result.card?.data.name).toBe('Chub Mage');
    expect(result.card?.data.description).toBe('A powerful mage from chub.ai');
    expect(result.card?.data.tags).toContain('fantasy');
    expect(result.card?.data.extensions?.chub).toBeDefined();

    vi.unstubAllGlobals();
  });
});
