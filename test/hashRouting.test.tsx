// @vitest-environment jsdom
import '../test/setup';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { db } from '../src/db';
import { useCardStore } from '../src/store/useCardStore';
import { useHashRouting } from '../src/routing/useHashRouting';

async function makeCard(name: string): Promise<string> {
  return useCardStore.getState().createNewCard(name);
}

beforeEach(async () => {
  await db.cards.clear();
  await db.settings.clear();
  useCardStore.setState({ activeTab: 'gallery', activeCardUuid: null, activeCard: null, activeCardRecord: null, cards: [], saveTimeoutId: null });
  window.history.replaceState(null, '', '/');
});

describe('useHashRouting', () => {
  it('restores card and tab from the hash on load', async () => {
    const uuid = await makeCard('Alice');
    useCardStore.setState({ activeTab: 'gallery', activeCardUuid: null, activeCard: null });
    window.history.replaceState(null, '', `#/forge/${uuid}/lorebook`);
    renderHook(() => useHashRouting());
    await waitFor(() => expect(useCardStore.getState().activeTab).toBe('lorebook'));
    expect(useCardStore.getState().activeCardUuid).toBe(uuid);
  });

  it('falls back to Library for an unknown card id without adding history entries', async () => {
    window.history.replaceState(null, '', '#/forge/does-not-exist/details');
    const before = window.history.length;
    renderHook(() => useHashRouting());
    await waitFor(() => expect(window.location.hash).toBe('#/library'));
    expect(useCardStore.getState().activeTab).toBe('gallery');
    expect(window.history.length).toBe(before);
  });

  it('normalises an empty hash to #/library', async () => {
    renderHook(() => useHashRouting());
    await waitFor(() => expect(window.location.hash).toBe('#/library'));
  });

  it('pushes on screen change, replaces on sub-tab change', async () => {
    const uuid = await makeCard('Bob');
    window.history.replaceState(null, '', '#/library');
    renderHook(() => useHashRouting());
    await waitFor(() => expect(window.location.hash).toBe('#/library'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const start = window.history.length;

    act(() => { useCardStore.getState().setActiveTab('editor'); });
    expect(window.location.hash).toBe(`#/forge/${uuid}/details`);
    expect(window.history.length).toBe(start + 1);

    act(() => { useCardStore.getState().setActiveTab('lorebook'); });
    expect(window.location.hash).toBe(`#/forge/${uuid}/lorebook`);
    expect(window.history.length).toBe(start + 1);
  });

  it('applies the hash on popstate (Back button)', async () => {
    const uuid = await makeCard('Cara');
    window.history.replaceState(null, '', '#/library');
    renderHook(() => useHashRouting());
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    act(() => { useCardStore.getState().setActiveTab('editor'); });
    expect(useCardStore.getState().activeTab).toBe('editor');

    window.history.replaceState(null, '', '#/settings');
    await act(async () => { window.dispatchEvent(new PopStateEvent('popstate')); await new Promise((r) => setTimeout(r, 20)); });
    expect(useCardStore.getState().activeTab).toBe('settings');
    expect(uuid).toBeTruthy();
  });
});

describe('route-driven card switch flushes autosave (D-13)', () => {
  it('saves the previous card before the active card changes', async () => {
    const a = await makeCard('First');
    const b = await makeCard('Second');
    await useCardStore.getState().selectCardForEditing(a);
    window.history.replaceState(null, '', `#/forge/${a}/details`);
    renderHook(() => useHashRouting());
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });

    const seen: Array<string | null> = [];
    const save = vi.fn(async () => { seen.push(useCardStore.getState().activeCardUuid); });
    useCardStore.setState({ saveActiveCardMetadata: save, saveTimeoutId: setTimeout(() => {}, 10_000) });

    window.history.replaceState(null, '', `#/forge/${b}/details`);
    await act(async () => { window.dispatchEvent(new PopStateEvent('popstate')); await new Promise((r) => setTimeout(r, 50)); });

    expect(save).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([a]);
    expect(useCardStore.getState().activeCardUuid).toBe(b);
    expect(useCardStore.getState().saveTimeoutId).toBeNull();
  });
});
