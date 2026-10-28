// @vitest-environment jsdom
import '../test/setup';
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspaceSubNav } from '../src/components/WorkspaceSubNav';
import { useCardStore } from '../src/store/useCardStore';
import { createNewDefaultCard } from '../src/utils/cardDefaults';
import { validateCardCompleteness } from '../src/utils/validation';

describe('WorkspaceSubNav completeness checklist', () => {
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

  it('opens an accessible list of completeness issues from a touch-sized button', () => {
    const card = useCardStore.getState().activeCard!;
    const warnings = validateCardCompleteness(card);
    expect(warnings.length).toBeGreaterThan(0);

    render(<WorkspaceSubNav />);

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
  });
});
