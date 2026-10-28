import { describe, it, expect } from 'vitest';
import { readCardFromCharx, writeCardToCharx } from '../src/io/charx';
import { CharacterCardV3 } from '../src/schemas/cardSchema';

describe('roundtrip', () => {
  it('imports, exports, and re-imports a card', async () => {
    const originalCard: CharacterCardV3 = {
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: {
        name: 'Roundtrip Character',
        description: 'Test description',
        personality: 'Friendly',
        scenario: 'A test scenario',
        first_mes: 'Hello there!',
        mes_example: 'User: Hi\nChar: Hello',
        creator_notes: 'Some notes',
        system_prompt: 'System rules',
        post_history_instructions: 'Post history rules',
        tags: ['test', 'roundtrip'],
        creator: 'Tester',
        character_version: '1.0',
        alternate_greetings: ['Alt greeting 1', 'Alt greeting 2'],
        group_only_greetings: [],
        extensions: { custom_key: 'custom_value' },
        assets: [],
        character_book: null
      }
    };

    const originalAssets = {
      'embeded://icon/main.png': new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82])
    };

    // 1. Export
    const charxBuffer = await writeCardToCharx(originalCard, originalAssets);

    // 2. Import
    const { card: importedCard, embeddedAssets: importedAssets } = await readCardFromCharx(charxBuffer);

    // 3. Assert equality
    // We only compare the data because the import might add default fields depending on normalization
    expect(importedCard.data.name).toBe(originalCard.data.name);
    expect(importedCard.data.description).toBe(originalCard.data.description);
    expect(importedCard.data.personality).toBe(originalCard.data.personality);
    expect(importedCard.data.tags).toEqual(originalCard.data.tags);
    expect(importedCard.data.extensions).toEqual(originalCard.data.extensions);

    // Assets
    expect(importedAssets['embeded://icon/main.png']).toBeDefined();
    expect(importedAssets['embeded://icon/main.png'].byteLength).toBe(16);
  });

  it('imports, exports, and re-imports a card with non-trivial character_book in CHARX format', async () => {
    const cardWithLorebook: CharacterCardV3 = {
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: {
        name: 'Lorebook Roundtrip Character',
        description: 'Test description',
        personality: 'Friendly',
        scenario: '',
        first_mes: 'Hello!',
        mes_example: '',
        creator_notes: '',
        system_prompt: '',
        post_history_instructions: '',
        tags: ['lorebook', 'test'],
        creator: 'Tester',
        character_version: '1.0',
        alternate_greetings: [],
        group_only_greetings: [],
        extensions: { custom_key: 'custom_value' },
        assets: [],
        character_book: {
          name: 'World Knowledge',
          description: 'A rich lorebook',
          extensions: { global_setting: 'active' },
          entries: [
            {
              keys: ['dragon', 'fire'],
              secondary_keys: [],
              comment: 'Dragon lore',
              content: 'Dragons breathe fire.',
              constant: false,
              selective: true,
              insertion_order: 100,
              enabled: true,
              position: 'before_char',
              use_regex: false,
              extensions: { plugin_meta: { depth: 4 } },
            },
            {
              keys: ['sword'],
              secondary_keys: ['blade'],
              comment: 'Sword lore',
              content: 'A sharp blade.',
              constant: true,
              selective: false,
              insertion_order: 50,
              enabled: true,
              position: 'after_char',
              use_regex: true,
              extensions: { plugin_meta: { depth: 1 } },
            },
          ],
        },
      },
    };

    const assets = {
      'embeded://icon/main.png': new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]),
    };

    const charxBuffer = await writeCardToCharx(cardWithLorebook, assets);
    const { card: importedCard } = await readCardFromCharx(charxBuffer);

    expect(importedCard.data.name).toBe(cardWithLorebook.data.name);
    expect(importedCard.data.character_book).toBeDefined();
    expect(importedCard.data.character_book?.name).toBe('World Knowledge');
    expect(importedCard.data.character_book?.extensions).toEqual({ global_setting: 'active' });
    expect(importedCard.data.character_book?.entries.length).toBe(2);

    const entry1 = importedCard.data.character_book?.entries[0];
    expect(entry1?.selective).toBe(true);
    expect(entry1?.secondary_keys).toEqual([]);
    expect(entry1?.extensions).toEqual({ plugin_meta: { depth: 4 } });
  });

  it('imports, exports, and re-imports a card with non-trivial character_book in PNG format', async () => {
    const cardWithLorebook: CharacterCardV3 = {
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: {
        name: 'PNG Lorebook Character',
        description: 'PNG Test description',
        personality: 'Bold',
        scenario: '',
        first_mes: 'Greetings!',
        mes_example: '',
        creator_notes: '',
        system_prompt: '',
        post_history_instructions: '',
        tags: ['png', 'lorebook'],
        creator: 'Tester',
        character_version: '1.0',
        alternate_greetings: [],
        group_only_greetings: [],
        extensions: { custom_png_ext: 'png_val' },
        assets: [],
        character_book: {
          name: 'PNG World Lore',
          description: 'Lore for PNG test',
          extensions: { png_lore_ext: true },
          entries: [
            {
              keys: ['magic', 'spell'],
              secondary_keys: [],
              comment: 'Magic entry',
              content: 'Magic requires mana.',
              constant: false,
              selective: true,
              insertion_order: 10,
              enabled: true,
              position: 'before_char',
              use_regex: false,
              extensions: { selective_test: true },
            },
          ],
        },
      },
    };

    const { exportCardData, importCardData } = await import('../src/io');
    const pngBuffer = await exportCardData(cardWithLorebook, 'png');
    const result = await importCardData(pngBuffer, 'test.png');

    expect(result.card).toBeDefined();
    const importedCard = result.card!;
    expect(importedCard.data.name).toBe(cardWithLorebook.data.name);
    expect(importedCard.data.character_book).toBeDefined();
    expect(importedCard.data.character_book?.name).toBe('PNG World Lore');
    expect(importedCard.data.character_book?.entries[0].selective).toBe(true);
    expect(importedCard.data.character_book?.entries[0].secondary_keys).toEqual([]);
    expect(importedCard.data.character_book?.entries[0].extensions).toEqual({ selective_test: true });
  });
});
