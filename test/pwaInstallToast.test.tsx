// @vitest-environment jsdom
import '../test/setup';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWAInstall, __resetInstallToastsForTests } from '../src/hooks/usePWAInstall';
import { useToastStore } from '../src/store/useToastStore';

function setStandalone(on: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: on && q.includes('standalone'),
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('PWA install toasts', () => {
  beforeEach(() => {
    __resetInstallToastsForTests();
    useToastStore.setState({ toasts: [] });
    localStorage.clear();
    setStandalone(false);
  });

  it('shows one toast on appinstalled even with several hook instances', () => {
    renderHook(() => usePWAInstall());
    renderHook(() => usePWAInstall());
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].title).toMatch(/installed/i);
  });

  it('welcomes once on first standalone launch, not on later launches', () => {
    setStandalone(true);
    renderHook(() => usePWAInstall());
    expect(useToastStore.getState().toasts).toHaveLength(1);

    useToastStore.setState({ toasts: [] });
    __resetInstallToastsForTests();
    renderHook(() => usePWAInstall());
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('stays silent in a normal browser tab', () => {
    renderHook(() => usePWAInstall());
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
