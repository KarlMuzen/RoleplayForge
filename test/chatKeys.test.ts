import { describe, expect, it } from 'vitest';
import { shouldSendOnEnter } from '../src/utils/chatKeys';

describe('shouldSendOnEnter', () => {
  it('sends on Enter on a computer', () => {
    expect(shouldSendOnEnter({ key: 'Enter', shiftKey: false }, false)).toBe(true);
  });

  it('does not send on Shift+Enter', () => {
    expect(shouldSendOnEnter({ key: 'Enter', shiftKey: true }, false)).toBe(false);
  });

  it('does not send on a touch device', () => {
    expect(shouldSendOnEnter({ key: 'Enter', shiftKey: false }, true)).toBe(false);
  });

  it('does not send while an input composition is in progress', () => {
    expect(
      shouldSendOnEnter({ key: 'Enter', shiftKey: false, isComposing: true }, false)
    ).toBe(false);
  });

  it('does not send for keys other than Enter', () => {
    expect(shouldSendOnEnter({ key: 'Space', shiftKey: false }, false)).toBe(false);
  });
});
