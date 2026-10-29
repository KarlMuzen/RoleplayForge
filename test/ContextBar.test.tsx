// @vitest-environment jsdom
import '../test/setup';
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
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
    });
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
    useCardStore.setState({ activeTab: 'crucible' });
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
});
