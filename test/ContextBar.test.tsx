// @vitest-environment jsdom
import '../test/setup';
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContextBar } from '../src/components/ContextBar';
import { useCardStore } from '../src/store/useCardStore';
import { createNewDefaultCard } from '../src/utils/cardDefaults';
import { validateCardCompleteness } from '../src/utils/validation';

describe('ContextBar', () => {
  beforeEach(() => {
    const card = createNewDefaultCard('Checklist test');
    card.data.description = '';
    card.data.personality = '';
    card.data.first_mes = '';
    useCardStore.setState({
      activeTab: 'editor',
      activeCard: card,
      activeCardUuid: 'checklist-test',
      undoStack: [],
      redoStack: [],
      saveState: 'idle',
      saveTimeoutId: null,
    });
  });

  afterEach(() => {
    const timeout = useCardStore.getState().saveTimeoutId;
    if (timeout) clearTimeout(timeout);
    useCardStore.setState({ saveTimeoutId: null, saveState: 'idle' });
  });

  it('opens an accessible completeness checklist with Escape and outside-tap dismissal', () => {
    const card = useCardStore.getState().activeCard!;
    const warnings = validateCardCompleteness(card);
    expect(warnings.length).toBeGreaterThan(0);

    render(<ContextBar />);

    const toggle = screen.getByRole('button', {
      name: `Incomplete card: ${warnings.length} issues. Show checklist`,
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle.className).toContain('min-w-11');
    expect(toggle.className).toContain('min-h-11');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const checklist = screen.getByRole('region', {
      name: new RegExp(`Incomplete card · ${warnings.length} issues`),
    });
    for (const warning of warnings) {
      expect(within(checklist).getByText(warning)).toBeInTheDocument();
    }

    fireEvent.click(within(checklist).getByRole('button', {
      name: 'Close card completeness checklist',
    }));
    expect(screen.queryByRole('region', {
      name: new RegExp(`Incomplete card · ${warnings.length} issues`),
    })).not.toBeInTheDocument();

    fireEvent.click(toggle);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('region', {
      name: new RegExp(`Incomplete card · ${warnings.length} issues`),
    })).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();

    fireEvent.click(toggle);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('region', {
      name: new RegExp(`Incomplete card · ${warnings.length} issues`),
    })).not.toBeInTheDocument();
  });

  it('shows Test tabs and the incomplete-card checklist in Test mode', () => {
    act(() => useCardStore.setState({ activeTab: 'crucible' }));
    render(<ContextBar />);

    const nav = screen.getByRole('navigation', { name: 'Test sections' });
    const stressTests = within(nav).getByRole('button', { name: 'Stress tests' });
    const enhancer = within(nav).getByRole('button', { name: 'Enhancer' });

    expect(stressTests).toHaveAttribute('aria-current', 'page');
    expect(enhancer).not.toHaveAttribute('aria-current');
    for (const tab of within(nav).getAllByRole('button')) {
      expect(tab.className).toContain('min-h-11');
    }

    const warnings = validateCardCompleteness(useCardStore.getState().activeCard);
    expect(screen.getByRole('button', {
      name: `Incomplete card: ${warnings.length} issues. Show checklist`,
    })).toBeInTheDocument();

    fireEvent.click(enhancer);
    expect(useCardStore.getState().activeTab).toBe('enhancer');
    expect(enhancer).toHaveAttribute('aria-current', 'page');
  });

  it('gives every Forge tab a 44px minimum height and changes activeTab when selected', () => {
    render(<ContextBar />);

    const nav = screen.getByRole('navigation', { name: 'Forge sections' });
    const tabs = within(nav).getAllByRole('button');
    expect(tabs).toHaveLength(4);
    for (const tab of tabs) {
      expect(tab.className).toContain('min-h-11');
      expect(tab.className).toContain('whitespace-nowrap');
    }

    fireEvent.click(within(nav).getByRole('button', { name: 'Lorebook' }));
    expect(useCardStore.getState().activeTab).toBe('lorebook');
    expect(within(nav).getByRole('button', { name: 'Lorebook' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows Undo and Redo on Forge tabs only when a card is active', () => {
    render(<ContextBar />);

    const undo = screen.getByRole('button', { name: 'Undo' });
    const redo = screen.getByRole('button', { name: 'Redo' });
    expect(undo).toBeDisabled();
    expect(redo).toBeDisabled();

    act(() => useCardStore.setState({ undoStack: [{ cardData: useCardStore.getState().activeCard! }], redoStack: [] }));
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();

    useCardStore.setState({ activeTab: 'crucible' });
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Redo' })).not.toBeInTheDocument();
    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
  });

  it('undoes a normal lorebook update and restores the previous lorebook', () => {
    const card = useCardStore.getState().activeCard!;
    const originalLorebook = {
      name: 'Original lorebook',
      entries: [{
        name: 'Original entry',
        keys: ['original'],
        content: 'Original content',
        enabled: true,
        insertion_order: 100,
        use_regex: false,
        extensions: {},
      }],
      extensions: {},
    };
    useCardStore.setState({
      activeCard: { ...card, data: { ...card.data, character_book: originalLorebook } },
    });

    render(<ContextBar />);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();

    act(() => {
      useCardStore.getState().updateActiveCardData((current) => ({
        ...current,
        data: {
          ...current.data,
          character_book: {
            ...current.data.character_book!,
            name: 'Edited lorebook',
            entries: [
              ...current.data.character_book!.entries,
              {
                name: 'Added entry',
                keys: ['added'],
                content: 'Added content',
                enabled: true,
                insertion_order: 101,
                use_regex: false,
                extensions: {},
              },
            ],
          },
        },
      }), { forceUndo: true });
    });

    expect(useCardStore.getState().activeCard?.data.character_book?.name).toBe('Edited lorebook');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(useCardStore.getState().activeCard?.data.character_book).toEqual(originalLorebook);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeEnabled();
  });

  it('shows the save-status chip for every saveState', () => {
    render(<ContextBar />);

    const states = [
      ['idle', 'Unsaved'],
      ['saving', 'Saving…'],
      ['saved', 'Saved'],
      ['error', 'Save failed'],
    ] as const;

    for (const [saveState, label] of states) {
      act(() => useCardStore.setState({ saveState }));
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(label).getAttribute('aria-live')).toBe('polite');
      expect(screen.getByText(label).className).toContain('whitespace-nowrap');
    }
  });

});
