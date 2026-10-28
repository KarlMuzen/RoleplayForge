import { describe, it, expect } from 'vitest';
import { applyCardPatch } from '../src/utils/applyCardPatch';
import type { CharacterCardV3 } from '../src/schemas/cardSchema';
import type { CardPatch } from '../src/schemas/patchSchema';
import { useCardStore } from '../src/store/useCardStore';

describe('applyCardPatch', () => {
  const sampleCard: CharacterCardV3 = {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name: 'Eldrin',
      description: 'A wise archmage.',
      personality: 'Stoic and mysterious.',
      scenario: 'In the ancient library.',
      first_mes: 'Greetings, traveler.',
      mes_example: '<START>\nUser: Hi\nEldrin: Hello.',
      system_prompt: 'Stay in character as Eldrin.',
      post_history_instructions: 'Keep responses under 3 paragraphs.',
      creator_notes: 'Created for fantasy roleplay.',
      tags: ['fantasy', 'mage'],
      creator: 'Author',
      character_version: '1.0',
      extensions: {},
      alternate_greetings: [],
      group_only_greetings: [],
      character_book: {
        entries: [
          {
            keys: ['staff'],
            content: 'Eldrin carries a staff made of elder wood.',
            enabled: true,
            insertion_order: 100,
            extensions: {},
            use_regex: false,
          },
          {
            keys: ['spells'],
            content: 'Master of frost and lightning magic.',
            enabled: true,
            insertion_order: 100,
            extensions: {},
            use_regex: false,
          },
        ],
        extensions: {},
      },
    },
  };

  it('replaces a top-level field without mutating original card', () => {
    const patch = {
      field: 'personality' as const,
      action: 'replace' as const,
      value: 'Cheerful and energetic wizard.',
      rationale: 'Update personality to be more approachable.',
    };

    const updated = applyCardPatch(sampleCard, patch);

    expect(updated.data.personality).toBe('Cheerful and energetic wizard.');
    expect(sampleCard.data.personality).toBe('Stoic and mysterious.');
    expect(updated).not.toBe(sampleCard);
  });

  it('appends to a top-level field with a newline separator', () => {
    const patch = {
      field: 'description' as const,
      action: 'append' as const,
      value: 'Wears deep navy robes with silver runes.',
      rationale: 'Add visual description details.',
    };

    const updated = applyCardPatch(sampleCard, patch);

    expect(updated.data.description).toBe('A wise archmage.\nWears deep navy robes with silver runes.');
    expect(sampleCard.data.description).toBe('A wise archmage.');
  });

  it('replaces a lorebook entry content at the specified index', () => {
    const patch = {
      field: 'lorebook_entry' as const,
      action: 'replace' as const,
      value: 'The staff is crowned with an ethereal blue crystal.',
      lorebookEntryIndex: 0,
      rationale: 'Clarify description of the staff artifact.',
    };

    const updated = applyCardPatch(sampleCard, patch);

    expect(updated.data.character_book?.entries[0].content).toBe(
      'The staff is crowned with an ethereal blue crystal.'
    );
    expect(sampleCard.data.character_book?.entries[0].content).toBe(
      'Eldrin carries a staff made of elder wood.'
    );
  });

  it('appends to a lorebook entry content at the specified index', () => {
    const patch = {
      field: 'lorebook_entry' as const,
      action: 'append' as const,
      value: 'Can cast Chain Lightning during thunderstorms.',
      lorebookEntryIndex: 1,
      rationale: 'Expand spell capabilities.',
    };

    const updated = applyCardPatch(sampleCard, patch);

    expect(updated.data.character_book?.entries[1].content).toBe(
      'Master of frost and lightning magic.\nCan cast Chain Lightning during thunderstorms.'
    );
    expect(sampleCard.data.character_book?.entries[1].content).toBe(
      'Master of frost and lightning magic.'
    );
  });

  it('throws an error when lorebookEntryIndex is out of bounds', () => {
    const patchOutOfBounds = {
      field: 'lorebook_entry' as const,
      action: 'replace' as const,
      value: 'Non-existent entry content',
      lorebookEntryIndex: 99,
      rationale: 'Attempt invalid index',
    };

    expect(() => applyCardPatch(sampleCard, patchOutOfBounds)).toThrow(/out of bounds/i);
  });

  it('throws an error when lorebookEntryIndex is missing for lorebook_entry', () => {
    const patchMissingIndex = {
      field: 'lorebook_entry' as const,
      action: 'replace' as const,
      value: 'Missing index content',
      rationale: 'Attempt missing index',
    };

    expect(() => applyCardPatch(sampleCard, patchMissingIndex as unknown as CardPatch)).toThrow(/Invalid lorebookEntryIndex/i);
  });

  it('supports undoing applied patches via useCardStore', () => {
    useCardStore.setState({
      activeCard: sampleCard,
      undoStack: [],
      redoStack: [],
    });

    const patch = {
      field: 'personality' as const,
      action: 'replace' as const,
      value: 'Cheerful and energetic wizard.',
      rationale: 'Update personality to be more approachable.',
    };

    useCardStore.getState().updateActiveCardData((prev) => applyCardPatch(prev, patch));

    expect(useCardStore.getState().activeCard?.data.personality).toBe('Cheerful and energetic wizard.');
    expect(useCardStore.getState().undoStack.length).toBeGreaterThan(0);

    useCardStore.getState().undo();

    expect(useCardStore.getState().activeCard?.data.personality).toBe('Stoic and mysterious.');
  });
  it('does not change the card or history when a multi-patch update fails', () => {
    const redoEntry = { cardData: JSON.parse(JSON.stringify(sampleCard)) };
    useCardStore.setState({
      activeCard: sampleCard,
      undoStack: [],
      redoStack: [redoEntry],
    });

    const validPatch: CardPatch = {
      field: 'personality',
      action: 'replace',
      value: 'A different personality.',
      rationale: 'Valid first edit.',
    };
    const invalidPatch: CardPatch = {
      field: 'lorebook_entry',
      action: 'replace',
      value: 'This must not be applied.',
      lorebookEntryIndex: 99,
      rationale: 'Invalid second edit.',
    };

    expect(() => {
      useCardStore.getState().updateActiveCardData(
        (prev) => [validPatch, invalidPatch].reduce((card, patch) => applyCardPatch(card, patch), prev),
        { forceUndo: true }
      );
    }).toThrow(/out of bounds/i);

    expect(useCardStore.getState().activeCard).toEqual(sampleCard);
    expect(useCardStore.getState().undoStack).toEqual([]);
    expect(useCardStore.getState().redoStack).toEqual([redoEntry]);
  });

  it('applies multiple patches as one forced undo step', () => {
    useCardStore.setState({ activeCard: sampleCard, undoStack: [], redoStack: [] });

    const patches: CardPatch[] = [
      {
        field: 'personality',
        action: 'replace',
        value: 'Measured and kind.',
        rationale: 'Update personality.',
      },
      {
        field: 'description',
        action: 'append',
        value: 'Carries a silver lantern.',
        rationale: 'Add a detail.',
      },
    ];

    useCardStore.getState().updateActiveCardData(
      (prev) => patches.reduce((card, patch) => applyCardPatch(card, patch), prev),
      { forceUndo: true }
    );

    expect(useCardStore.getState().activeCard?.data.personality).toBe('Measured and kind.');
    expect(useCardStore.getState().activeCard?.data.description).toContain('Carries a silver lantern.');
    expect(useCardStore.getState().undoStack).toHaveLength(1);

    useCardStore.getState().undo();
    expect(useCardStore.getState().activeCard).toEqual(sampleCard);
  });

});
