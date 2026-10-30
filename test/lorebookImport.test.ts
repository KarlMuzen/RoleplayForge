import { describe, expect, it } from 'vitest';
import { exportCardData, importCardData } from '../src/io';
import { readPastedText } from '../src/core/pasteImport';
import type { CharacterCardV3 } from '../src/schemas/cardSchema';
import { looksLikeStandaloneLorebook } from '../src/utils/normalizeLorebook';

const worldInfo = {
  entries: {
    '0': {
      uid: 0,
      key: ['dragon'],
      keysecondary: ['fire'],
      comment: 'Dragon',
      content: 'Big lizard',
      order: 100,
      disable: false,
    },
  },
};

describe('looksLikeStandaloneLorebook', () => {
  it.each([
    ['array entries', { entries: [] }, true],
    ['dictionary entries', { entries: { '0': { content: 'x' } } }, true],
    ['empty dictionary entries', { entries: {} }, true],
    ['name and description', { name: 'Book', description: 'Notes', entries: [] }, true],
    ['missing entries', { name: 'Book' }, false],
    ['null entries', { entries: null }, false],
    ['string entries', { entries: 'not a list' }, false],
    ['array root', [{ entries: [] }], false],
    ['null root', null, false],
    ['string root', 'world info', false],
    ['V2 card spec', { spec: 'chara_card_v2', entries: [] }, false],
    ['V3 card spec', { spec: 'chara_card_v3', entries: [] }, false],
    ['card data object', { data: {}, entries: [] }, false],
    ['first_mes field', { entries: [], first_mes: 'Hello' }, false],
    ['mes_example field', { entries: [], mes_example: 'Hello' }, false],
    ['personality field', { entries: [], personality: 'Kind' }, false],
    ['scenario field', { entries: [], scenario: 'A ship' }, false],
    ['char_greeting field', { entries: [], char_greeting: 'Hello' }, false],
    ['char_name field', { entries: [], char_name: 'Mira' }, false],
  ] as const)('classifies %s as %s', (_label, value, expected) => {
    expect(looksLikeStandaloneLorebook(value)).toBe(expected);
  });

  it('rejects non-plain objects', () => {
    expect(looksLikeStandaloneLorebook(new Date())).toBe(false);
  });
});

describe('SillyTavern standalone lorebook import', () => {
  it('imports the dictionary-shaped world-info probe as a named lorebook', async () => {
    const result = await importCardData(JSON.stringify(worldInfo), 'world.json');

    expect(result.format).toBe('lorebook');
    expect(result.card).toBeUndefined();
    expect(result.lorebook).toMatchObject({
      name: 'world',
      entries: [{
        keys: ['dragon'],
        secondary_keys: ['fire'],
        content: 'Big lizard',
        enabled: true,
      }],
    });
  });

  it('preserves an explicit non-empty lorebook name', async () => {
    const result = await importCardData(JSON.stringify({
      name: 'The Vale',
      entries: [],
    }), 'world.json');

    expect(result.format).toBe('lorebook');
    expect(result.lorebook?.name).toBe('The Vale');
  });

  it('keeps disabled entries disabled', async () => {
    const result = await importCardData(JSON.stringify({
      entries: [{ key: ['sealed'], content: 'Hidden', disable: true }],
    }), 'sealed.json');

    expect(result.format).toBe('lorebook');
    expect(result.lorebook?.entries[0].enabled).toBe(false);
  });

  it('imports array-shaped entries', async () => {
    const result = await importCardData(JSON.stringify({
      entries: [{ key: ['a'], content: 'x' }],
    }), 'array.json');

    expect(result.format).toBe('lorebook');
    expect(result.lorebook?.entries).toMatchObject([{ keys: ['a'], content: 'x' }]);
  });

  it('does not throw for an empty entries object', async () => {
    await expect(importCardData(JSON.stringify({ entries: {}, name: 'Empty' }))).resolves.toBeDefined();
  });

  it('still imports V2 and V3 cards with embedded character books as cards', async () => {
    const characterBook = { entries: [{ keys: ['dragon'], content: 'Fire' }] };
    const v2 = {
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: { name: 'V2 card', first_mes: 'Hello', character_book: characterBook },
    };
    const v3 = {
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: { name: 'V3 card', first_mes: 'Hello', character_book: characterBook },
    };

    for (const input of [v2, v3]) {
      const result = await importCardData(JSON.stringify(input));
      expect(result.format).toBe('json');
      expect(result.card?.data.character_book?.entries).toHaveLength(1);
      expect(result.lorebook).toBeUndefined();
    }
  });

  it('keeps the explicit lorebook_v3 format working', async () => {
    const result = await importCardData(JSON.stringify({
      spec: 'lorebook_v3',
      data: { entries: [] },
    }));

    expect(result.format).toBe('lorebook');
    expect(result.lorebook?.entries).toEqual([]);
  });

  it('does not classify a character with first_mes as a standalone lorebook', async () => {
    const result = await importCardData(JSON.stringify({
      entries: { '0': { content: 'x' } },
      first_mes: 'hi',
    }));

    expect(result.format).toBe('json');
    expect(result.card?.data.first_mes).toBe('hi');
    expect(result.lorebook).toBeUndefined();
  });

  it('recognizes standalone world-info in the paste reader without creating a card', async () => {
    const result = await readPastedText(JSON.stringify(worldInfo));

    expect(result.kind).toBe('lorebook-json');
    expect(result.card).toBeUndefined();
  });

  it('preserves UTF-8 text exactly through PNG export and import', async () => {
    const description = 'em—dash ’quote “smart” 日本';
    const card: CharacterCardV3 = {
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: {
        name: 'UTF-8 roundtrip',
        description,
        tags: [],
        creator: '',
        character_version: '',
        mes_example: '',
        extensions: {},
        system_prompt: '',
        post_history_instructions: '',
        first_mes: '',
        alternate_greetings: [],
        personality: '',
        scenario: '',
        creator_notes: '',
        group_only_greetings: [],
        assets: [],
        character_book: null,
      },
    };

    const png = await exportCardData(card, 'png');
    const result = await importCardData(png, 'utf8.png');

    expect(result.format).toBe('png');
    expect(result.card?.data.description).toBe(description);
  });
});
