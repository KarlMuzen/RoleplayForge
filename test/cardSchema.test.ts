import { describe, it, expect } from 'vitest';
import { CharacterCardV3StorageSchema } from '../src/schemas/cardSchema';

describe('cardSchema', () => {
  const validCard = {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name: 'Test',
      description: 'A test character',
      tags: [],
      creator: '',
      character_version: '',
      mes_example: '',
      extensions: {},
      system_prompt: '',
      post_history_instructions: '',
      first_mes: '',
      alternate_greetings: [],
      group_only_greetings: [],
      personality: '',
      scenario: '',
      creator_notes: '',
      character_book: null,
      assets: []
    }
  };

  it('validates a correct card', () => {
    const result = CharacterCardV3StorageSchema.safeParse(validCard);
    expect(result.success).toBe(true);
  });

  it('rejects field lengths exceeding bounds', () => {
    const longName = 'A'.repeat(200); // Max is 100
    const invalidCard = {
      ...validCard,
      data: {
        ...validCard.data,
        name: longName
      }
    };
    const result = CharacterCardV3StorageSchema.safeParse(invalidCard);
    expect(result.success).toBe(false);
  });

  it('rejects extensions payload cap exceeded', () => {
    const hugeExtensions = { data: 'A'.repeat(250000) }; // Max is 200,000 bytes
    const invalidCard = {
      ...validCard,
      data: {
        ...validCard.data,
        extensions: hugeExtensions
      }
    };
    const result = CharacterCardV3StorageSchema.safeParse(invalidCard);
    expect(result.success).toBe(false);
  });
});
