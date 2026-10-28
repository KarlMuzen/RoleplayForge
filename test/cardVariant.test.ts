// @vitest-environment jsdom
import './setup';
import { describe, it, expect, beforeEach } from 'vitest';
import { db, type StoredCard } from '../src/db';
import { useCardStore } from '../src/store/useCardStore';

describe('Card Variant (A/B testing) feature', () => {
  beforeEach(async () => {
    await db.cards.clear();
    useCardStore.setState({
      cards: [],
      activeCardUuid: null,
      activeCard: null,
    });
  });

  it('correctly forks an active card into a labeled variant', async () => {
    const parentUuid = 'parent-card-123';
    const parentCard: StoredCard = {
      uuid: parentUuid,
      name: 'Hero Character',
      tags: ['hero'],
      creator: 'Tester',
      cardData: {
        spec: 'chara_card_v3' as const,
        spec_version: '3.0' as const,
        data: {
          name: 'Hero Character',
          description: 'A brave hero.',
          personality: 'Valiant and kind.',
          scenario: 'In a dungeon.',
          first_mes: 'Hello there!',
          mes_example: '',
          creator_notes: '',
          system_prompt: '',
          post_history_instructions: '',
          tags: ['hero'],
          creator: 'Tester',
          character_version: '1.0',
          alternate_greetings: [],
          group_only_greetings: [],
          extensions: {},
        },
      },
    };

    await db.cards.add(parentCard);
    await useCardStore.getState().loadCardsFromDb();
    await useCardStore.getState().selectCardForEditing(parentUuid);

    const variantUuid = await useCardStore.getState().createVariant(parentUuid, 'Sarcastic Variant');

    expect(variantUuid).toBeDefined();
    const storedVariant = await db.cards.where('uuid').equals(variantUuid).first();
    expect(storedVariant).toBeDefined();
    expect(storedVariant?.variantOf).toBe(parentUuid);
    expect(storedVariant?.variantLabel).toBe('Sarcastic Variant');
    expect(storedVariant?.name).toBe('Hero Character (Sarcastic Variant)');
    expect(storedVariant?.cardData.data.name).toBe('Hero Character (Sarcastic Variant)');

    // Ensure activeCard switched to new variant
    const currentActiveUuid = useCardStore.getState().activeCardUuid;
    expect(currentActiveUuid).toBe(variantUuid);
  });

  it('defaults variant label to "Variant" if not specified or empty', async () => {
    const parentUuid = 'parent-card-456';
    const parentCard: StoredCard = {
      uuid: parentUuid,
      name: 'Rogue Character',
      tags: ['rogue'],
      creator: 'Tester',
      cardData: {
        spec: 'chara_card_v3' as const,
        spec_version: '3.0' as const,
        data: {
          name: 'Rogue Character',
          description: 'A sneaky rogue.',
          personality: 'Cunning.',
          scenario: 'In shadows.',
          first_mes: 'Who goes there?',
          mes_example: '',
          creator_notes: '',
          system_prompt: '',
          post_history_instructions: '',
          tags: ['rogue'],
          creator: 'Tester',
          character_version: '1.0',
          alternate_greetings: [],
          group_only_greetings: [],
          extensions: {},
        },
      },
    };

    await db.cards.add(parentCard);
    await useCardStore.getState().loadCardsFromDb();
    await useCardStore.getState().selectCardForEditing(parentUuid);

    const variantUuid = await useCardStore.getState().createVariant(parentUuid, '');

    const storedVariant = await db.cards.where('uuid').equals(variantUuid).first();
    expect(storedVariant?.variantOf).toBe(parentUuid);
    expect(storedVariant?.variantLabel).toBe('Variant');
    expect(storedVariant?.name).toBe('Rogue Character (Variant)');
  });

  it('proves deep-clone immutability when creating a variant', async () => {
    const parentUuid = 'parent-immutability-123';
    const parentCard: StoredCard = {
      uuid: parentUuid,
      name: 'Original Mage',
      tags: ['mage', 'magic'],
      creator: 'Archmage',
      cardData: {
        spec: 'chara_card_v3' as const,
        spec_version: '3.0' as const,
        data: {
          name: 'Original Mage',
          description: 'A wise old spellcaster with a silver beard.',
          personality: 'Stoic, knowledgeable.',
          scenario: 'In the high arcane tower.',
          first_mes: 'Welcome, apprentice.',
          mes_example: '<START>\n{{user}}: Teach me a spell.\n{{char}}: First, learn patience.',
          creator_notes: 'Original author notes.',
          system_prompt: 'Stay in character as a wise mage.',
          post_history_instructions: '',
          tags: ['mage', 'magic'],
          creator: 'Archmage',
          character_version: '1.0',
          alternate_greetings: ['Greetings, traveler.'],
          group_only_greetings: [],
          extensions: {
            customField: 'deepValue',
          },
        },
      },
    };

    await db.cards.add(parentCard);
    await useCardStore.getState().loadCardsFromDb();
    await useCardStore.getState().selectCardForEditing(parentUuid);

    const variantUuid = await useCardStore.getState().createVariant(parentUuid, 'Dark Mage Variant');

    // Mutate the active card's cardData in the store and save it
    useCardStore.getState().updateActiveCardData((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        description: 'A corrupted dark spellcaster wielding forbidden shadow magic.',
        personality: 'Chaotic, ruthless.',
        alternate_greetings: ['Fear the shadows!'],
      },
    }));
    await useCardStore.getState().saveActiveCard();

    // Verify the variant itself was updated
    const updatedVariant = await db.cards.where('uuid').equals(variantUuid).first();
    expect(updatedVariant?.cardData.data.description).toBe(
      'A corrupted dark spellcaster wielding forbidden shadow magic.'
    );

    // Verify the original source card in DB is completely untouched
    const sourceCardInDb = await db.cards.where('uuid').equals(parentUuid).first();
    expect(sourceCardInDb).toBeDefined();
    expect(sourceCardInDb?.name).toBe('Original Mage');
    expect(sourceCardInDb?.cardData.data.description).toBe(
      'A wise old spellcaster with a silver beard.'
    );
    expect(sourceCardInDb?.cardData.data.personality).toBe('Stoic, knowledgeable.');
    expect(sourceCardInDb?.cardData.data.alternate_greetings).toEqual(['Greetings, traveler.']);
  });

  it('handles legacy pre-migration card records without variant fields gracefully', async () => {
    const legacyUuid = 'legacy-card-v4-999';
    // Insert a legacy record without variantOf or variantLabel and schemaVersion 4
    const legacyRecord: StoredCard = {
      uuid: legacyUuid,
      name: 'Legacy Knight',
      tags: ['knight', 'paladin', 'classic'],
      creator: 'ClassicBuilder',
      creation_date: 1600000000,
      modification_date: 1600000000,
      cardData: {
        spec: 'chara_card_v3' as const,
        spec_version: '3.0' as const,
        data: {
          name: 'Legacy Knight',
          description: 'A knight from an older version of the schema.',
          personality: 'Noble and chivalrous.',
          scenario: 'Guarding the castle gates.',
          first_mes: 'Halt! Who approaches?',
          mes_example: '',
          creator_notes: '',
          system_prompt: '',
          post_history_instructions: '',
          tags: ['knight', 'paladin', 'classic'],
          creator: 'ClassicBuilder',
          character_version: '1.0',
          alternate_greetings: [],
          group_only_greetings: [],
          extensions: {},
        },
      },
      schemaVersion: 4,
    };

    await db.cards.add(legacyRecord);

    // Trigger loading from DB
    await useCardStore.getState().loadCardsFromDb();

    // Verify card is loaded in store
    const loadedCards = useCardStore.getState().cards;
    const loadedCard = loadedCards.find((c) => c.uuid === legacyUuid);
    expect(loadedCard).toBeDefined();
    expect(loadedCard?.name).toBe('Legacy Knight');
    expect(loadedCard?.tags).toEqual(['knight', 'paladin', 'classic']);
    expect(loadedCard?.creator).toBe('ClassicBuilder');
    expect(loadedCard?.variantOf).toBeUndefined();
    expect(loadedCard?.variantLabel).toBeUndefined();
    expect(loadedCard?.cardData.data.description).toBe('A knight from an older version of the schema.');

    // Verify selecting the legacy card for editing works cleanly
    await useCardStore.getState().selectCardForEditing(legacyUuid);
    const activeCard = useCardStore.getState().activeCard;
    expect(activeCard).toBeDefined();
    expect(activeCard?.data.name).toBe('Legacy Knight');
    expect(activeCard?.data.personality).toBe('Noble and chivalrous.');
  });
});

