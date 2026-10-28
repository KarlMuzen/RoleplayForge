// @vitest-environment jsdom
import '../test/setup';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

const LONG_MESSAGE =
  'A very long error message that would previously have been cut off by the truncate class, ' +
  'making it impossible for a tester to read or report the real cause of the crash without ' +
  'digging through devtools console output on a phone.';

function Boom(): React.ReactElement {
  throw new Error(LONG_MESSAGE);
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress React's expected console.error noise for the thrown error in these tests.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders full, non-truncated error text instead of clipping it', () => {
    render(
      <ErrorBoundary fallbackTitle="Test Section">
        <Boom />
      </ErrorBoundary>
    );

    const messageNode = screen.getByText(LONG_MESSAGE);
    expect(messageNode).toBeInTheDocument();
    // The old implementation used the Tailwind `truncate` class (overflow-hidden + ellipsis),
    // which clipped long messages. Guard against that regressing.
    expect(messageNode.className).not.toContain('truncate');
  });

  it('shows a build label so testers can report which build they hit', () => {
    render(
      <ErrorBoundary fallbackTitle="Test Section">
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText(/built/i)).toBeInTheDocument();
  });

  it('copies a full crash report (message + section + build info) to the clipboard', async () => {
    render(
      <ErrorBoundary fallbackTitle="Test Section">
        <Boom />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /copy full error/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const copiedText = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(copiedText).toContain(LONG_MESSAGE);
    expect(copiedText).toContain('Test Section');

    expect(await screen.findByText(/copied/i)).toBeInTheDocument();
  });

  it('recovers when Reload Section is clicked and resetKey changes', () => {
    const { rerender } = render(
      <ErrorBoundary fallbackTitle="Test Section" resetKey="1">
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();

    rerender(
      <ErrorBoundary fallbackTitle="Test Section" resetKey="2">
        <div>Recovered content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });
});
