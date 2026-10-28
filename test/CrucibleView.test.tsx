// @vitest-environment jsdom
import '../test/setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { CrucibleView } from '../src/components/CrucibleView';
import { useCardStore } from '../src/store/useCardStore';
import { db } from '../src/db';
import type { CharacterCardV3 } from '../src/schemas/cardSchema';

const mockSendLLMRequest = vi.fn().mockResolvedValue({ text: 'mock assistant reply' });
const mockSendSingleLLMRequest = vi.fn().mockResolvedValue({ 
  text: JSON.stringify({
    agendaHeld: true,
    tellConsistency: 5,
    openerQuality: 5,
    loreDelivery: 5,
    driftOnsetTurn: null,
    reasoning: "mock reasoning"
  })
});

vi.mock('../src/services/llmAdapter', () => ({
  sendLLMRequest: (...args: unknown[]) => mockSendLLMRequest(...args),
  sendSingleLLMRequest: (...args: unknown[]) => mockSendSingleLLMRequest(...args),
}));

describe('CrucibleView scenario run loop', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Clear the DB to ensure test isolation
    await db.cards.clear();

    const testCardData = {
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: {
        name: 'TestChar',
        description: '',
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
        creator_notes: '',
        system_prompt: '',
        post_history_instructions: '',
        tags: [],
        creator: '',
        character_version: '',
        alternate_greetings: [],
        group_only_greetings: [],
        extensions: {},
        entries: [],
        assets: [],
        character_book: null
      }
    };

    const testCard = {
      uuid: 'test-uuid',
      name: 'TestChar',
      creation_date: 0,
      modification_date: 0,
      tags: [],
      creator: '',
      order: 0,
      cardData: testCardData as unknown as CharacterCardV3,
      scenarios: []
    };
    
    // Insert into db so the real store functions can update it
    const id = await db.cards.add(testCard);

    useCardStore.setState({
      cards: [{...testCard, id}],
      activeCard: {
        spec: 'chara_card_v3',
        spec_version: '3.0',
        data: {
          name: 'TestChar',
          description: '',
          personality: '',
          scenario: '',
          first_mes: '',
          mes_example: '',
          creator_notes: '',
          system_prompt: '',
          post_history_instructions: '',
          tags: [],
          creator: '',
          character_version: '',
          alternate_greetings: [],
          group_only_greetings: [],
          extensions: {},
          entries: [],
          assets: [],
          character_book: null
        }
      },
      activeCardRecord: {...testCard, id},
      activeCardUuid: 'test-uuid',
      profiles: [{
        id: 1,
        uuid: 'profile-1',
        name: 'Test Profile',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        apiKey: 'test',
        isDefault: true,
      }],
      activeProfileUuid: 'profile-1',
      // DO NOT MOCK updateActiveCardScenarios - let it use the real implementation!
    });
  });

  it('runs scenario, triggers LLM, and stores result in fake-indexeddb', async () => {
    render(<CrucibleView />);
    
    const runBtn = screen.getByRole('button', { name: /Run Scenario/i });
    
    await act(async () => {
      fireEvent.click(runBtn);
    });
    
    await waitFor(() => {
      expect(mockSendLLMRequest).toHaveBeenCalled();
    }, { timeout: 10000 });
    
    // Check that it's updated in IndexedDB
    const updatedCard = await db.cards.where('uuid').equals('test-uuid').first();
    
    expect(updatedCard).toBeDefined();
    expect(updatedCard?.scenarios).toBeDefined();
    expect(updatedCard!.scenarios!.length).toBeGreaterThan(0);
    
    const runResult = updatedCard!.scenarios![0].lastRunResult?.['profile-1'];
    expect(runResult?.transcript).toBeDefined();
    expect(runResult?.transcript.length).toBeGreaterThan(0);
    const assistantMsg = runResult?.transcript.find((m) => m.role === 'assistant');
    expect(assistantMsg?.speakerUuid).toBeDefined();
    expect(assistantMsg?.speakerName).toBe('TestChar');
  }, 15000);

  it('runs multi-character group scenario and preserves speakerUuid and speakerName', async () => {
    const secondCardData = {
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: {
        name: 'CompanionChar',
        description: 'Companion description',
        personality: '',
        scenario: '',
        first_mes: 'Hello from companion!',
        mes_example: '',
        creator_notes: '',
        system_prompt: '',
        post_history_instructions: '',
        tags: [],
        creator: '',
        character_version: '',
        alternate_greetings: [],
        group_only_greetings: [],
        extensions: {},
        entries: [],
        assets: [],
        character_book: null
      }
    };

    const secondCard = {
      uuid: 'companion-uuid',
      name: 'CompanionChar',
      creation_date: 0,
      modification_date: 0,
      tags: [],
      creator: '',
      order: 1,
      cardData: secondCardData as unknown as CharacterCardV3,
      scenarios: []
    };

    const id2 = await db.cards.add(secondCard);
    const existingCards = useCardStore.getState().cards;
    useCardStore.setState({
      cards: [...existingCards, { ...secondCard, id: id2 }],
    });

    render(<CrucibleView />);

    // Open group picker
    const addCharsBtn = screen.getByRole('button', { name: /Add characters/i });
    fireEvent.click(addCharsBtn);

    // Click companion card checkbox
    const companionOption = screen.getByText('CompanionChar');
    fireEvent.click(companionOption);

    // Run scenario
    const runBtn = screen.getByRole('button', { name: /Run Scenario/i });
    await act(async () => {
      fireEvent.click(runBtn);
    });

    await waitFor(() => {
      expect(mockSendLLMRequest).toHaveBeenCalled();
    }, { timeout: 10000 });

    const updatedCard = await db.cards.where('uuid').equals('test-uuid').first();
    const runResult = updatedCard!.scenarios![0].lastRunResult?.['profile-1'];
    expect(runResult?.transcript).toBeDefined();
    expect(runResult?.transcript.length).toBeGreaterThan(0);
    // Transcripts should carry speaker info
    const hasCompanionSpeaker = runResult?.transcript.some(
      (m) => m.speakerUuid === 'companion-uuid' || m.speakerName === 'CompanionChar'
    );
    expect(hasCompanionSpeaker).toBe(true);
  }, 15000);
});


