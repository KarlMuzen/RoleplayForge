// @vitest-environment jsdom
import '../test/setup';
import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore } from '../src/store/useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
  });

  it('shows and removes toast notifications', () => {
    const id = useToastStore.getState().showToast({
      title: 'Export Successful',
      message: 'Exported "Aeliana" as PNG',
      type: 'success',
      duration: 0,
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].title).toBe('Export Successful');
    expect(toasts[0].message).toBe('Exported "Aeliana" as PNG');

    useToastStore.getState().removeToast(id);
    expect(useToastStore.getState().toasts.length).toBe(0);
  });
});
