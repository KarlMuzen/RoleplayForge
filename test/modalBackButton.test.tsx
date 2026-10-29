// @vitest-environment jsdom
import '../test/setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalA11y } from '../src/hooks/useModalA11y';

const wait = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const pop = () => act(async () => { window.dispatchEvent(new PopStateEvent('popstate')); await new Promise((r) => setTimeout(r, 0)); });

beforeEach(async () => {
  window.history.replaceState(null, '', '#/library');
  // Let the previous test's self-triggered-pop ignore window (150ms) expire.
  await new Promise((r) => setTimeout(r, 170));
});

describe('modal Back button', () => {
  it('owns one history entry while open', () => {
    const start = window.history.length;
    renderHook(() => useModalA11y(true, () => {}));
    expect(window.history.length).toBe(start + 1);
    expect(window.history.state).toEqual({ rfModal: true });
  });

  it('closes through the modal close handler on Back', async () => {
    const onClose = vi.fn();
    renderHook(() => useModalA11y(true, onClose));
    await pop();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes its history entry when closed by other means', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const { rerender } = renderHook(({ open }) => useModalA11y(open, () => {}), { initialProps: { open: true } });
    rerender({ open: false });
    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });

  it('keeps Back trapped when the modal refuses to close', async () => {
    const refuse = vi.fn(); // e.g. recovery key not yet saved
    renderHook(() => useModalA11y(true, refuse));
    const before = window.history.length;
    await pop();
    await wait(80);
    expect(refuse).toHaveBeenCalledTimes(1);
    expect(window.history.length).toBe(before + 1);
    expect(window.history.state).toEqual({ rfModal: true });
  });

  it('only the top modal reacts when two are open', async () => {
    const lower = vi.fn();
    const upper = vi.fn();
    renderHook(() => useModalA11y(true, lower));
    renderHook(() => useModalA11y(true, upper));
    await pop();
    expect(upper).toHaveBeenCalledTimes(1);
    expect(lower).not.toHaveBeenCalled();
  });

  it('does not leave an extra entry when unmounted after Back closed it', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const { rerender } = renderHook(({ open }) => useModalA11y(open, () => rerender({ open: false })), { initialProps: { open: true } });
    await pop();
    expect(back).not.toHaveBeenCalled();
    back.mockRestore();
  });
});
