// @vitest-environment jsdom
import '../test/setup';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { GalleryView, getCardRating } from '../src/components/GalleryView';
import { useCardStore } from '../src/store/useCardStore';
import { db, type StoredCard } from '../src/db';

const createMockCard = (
  uuid: string,
  name: string,
  tags: string[] = [],
  description = ''
): StoredCard => ({
  uuid,
  name,
  creator: 'TestAuthor',
  tags,
  modification_date: Date.now(),
  cardData: {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name,
      description,
      tags,
      creator: 'TestAuthor',
      character_version: '1.0',
      mes_example: '',
      extensions: {},
      system_prompt: '',
      post_history_instructions: '',
      first_mes: 'Hello',
      personality: '',
      scenario: '',
      creator_notes: '',
      alternate_greetings: [],
      group_only_greetings: [],
      assets: [],
      character_book: null,
    },
  },
  embeddedAssets: {},
});

describe('getCardRating function', () => {
  it('classifies cards with "Mature Themes" tag as nsfw (regression test)', () => {
    const card = createMockCard('c1', 'Mature Character', ['Mature Themes']);
    expect(getCardRating(card)).toBe('nsfw');
  });

  it('classifies explicit/18+/r18/lewd tags as nsfw', () => {
    expect(getCardRating(createMockCard('c2', 'Char 18+', ['18+']))).toBe('nsfw');
    expect(getCardRating(createMockCard('c3', 'Char Explicit', ['explicit']))).toBe('nsfw');
    expect(getCardRating(createMockCard('c4', 'Char R18', ['R18']))).toBe('nsfw');
    expect(getCardRating(createMockCard('c5', 'Char Lewd', ['lewd content']))).toBe('nsfw');
  });

  it('classifies sfw/safe tags as sfw', () => {
    expect(getCardRating(createMockCard('c6', 'Safe Char', ['sfw']))).toBe('sfw');
    expect(getCardRating(createMockCard('c7', 'Clean Char', ['safe-only']))).toBe('sfw');
  });

  it('classifies cards without tags as unrated', () => {
    const card = createMockCard('c8', 'Unrated Char', []);
    expect(getCardRating(card)).toBe('unrated');
  });

  it('detects nsfw disclaimer in description as nsfw', () => {
    const card = createMockCard('c9', 'Disclaimer Char', [], 'Warning: 18+ content inside');
    expect(getCardRating(card)).toBe('nsfw');
  });
});

describe('GalleryView component', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.cards.clear();
    useCardStore.setState({
      cards: [],
      activeCardUuid: null,
      searchQuery: '',
      selectedTag: null,
      selectedCardUuids: [],
      isLoadingCards: false,
    });
  });

  it('renders empty state when no cards exist', async () => {
    render(<GalleryView />);
    await waitFor(() => {
      expect(screen.getByText(/No Character Cards/i)).toBeDefined();
    });
  });

  it('renders card list and filters correctly by rating', async () => {
    const sfwCard = createMockCard('sfw-1', 'SFW Hero', ['sfw']);
    const nsfwCard = createMockCard('nsfw-1', 'Dark Villian', ['Mature Themes']);
    const unratedCard = createMockCard('unrated-1', 'Mystery Wanderer', []);

    await db.cards.bulkAdd([sfwCard, nsfwCard, unratedCard]);
    await useCardStore.getState().loadCardsFromDb();

    render(<GalleryView />);

    await waitFor(() => {
      expect(screen.getAllByText('SFW Hero').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Dark Villian').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Mystery Wanderer').length).toBeGreaterThanOrEqual(1);
    });

    // Filter by SFW: only SFW Hero should be visible, NOT Unrated or NSFW
    const sfwFilterBtn = screen.getByTestId('filter-rating-sfw');
    fireEvent.click(sfwFilterBtn);

    await waitFor(() => {
      expect(screen.getAllByText('SFW Hero').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Dark Villian')).toBeNull();
      expect(screen.queryByText('Mystery Wanderer')).toBeNull();
    });

    // Filter by NSFW: only Dark Villian ("Mature Themes") should be visible
    const nsfwFilterBtn = screen.getByTestId('filter-rating-nsfw');
    fireEvent.click(nsfwFilterBtn);

    await waitFor(() => {
      expect(screen.queryByText('SFW Hero')).toBeNull();
      expect(screen.getAllByText('Dark Villian').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Mystery Wanderer')).toBeNull();
    });

    // Filter by Unrated: only Mystery Wanderer should be visible
    const unratedFilterBtn = screen.getByTestId('filter-rating-unrated');
    fireEvent.click(unratedFilterBtn);

    await waitFor(() => {
      expect(screen.queryByText('SFW Hero')).toBeNull();
      expect(screen.queryByText('Dark Villian')).toBeNull();
      expect(screen.getAllByText('Mystery Wanderer').length).toBeGreaterThanOrEqual(1);
    });
  });
});
