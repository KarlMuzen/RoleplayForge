import { create } from 'zustand';
import { db } from '../db';
import { useToastStore } from './useToastStore';
import type { CardStore, TabType, UndoState } from './slices/types';
import { createUISlice } from './slices/uiSlice';
import { createCardSlice } from './slices/cardSlice';
import { createProfileSlice } from './slices/profileSlice';
import { createSessionSlice } from './slices/sessionSlice';
import { createAssistantSlice } from './slices/assistantSlice';

export type { TabType, UndoState, CardStore };

export const useCardStore = create<CardStore>((...a) => ({
  ...createUISlice(...a),
  ...createCardSlice(...a),
  ...createProfileSlice(...a),
  ...createSessionSlice(...a),
  ...createAssistantSlice(...a),
}));

if (typeof window !== 'undefined') {
  // Flushes uncommitted in-memory edits to IndexedDB when the user navigates away or hides the tab.
  // Note: During 'visibilitychange' (tab backgrounded), React remains mounted so error toasts render normally.
  // During true 'beforeunload' (tab/window close), toasts are best-effort because the browsing context may terminate
  // before React paints; this local-first architecture relies on IndexedDB persistence without an external beacon endpoint.
  const flushPendingSave = () => {
    const state = useCardStore.getState();
    if (state.activeCardUuid && state.saveState === 'saving') {
      // Fire-and-forget sync write, hoping the browser lets it finish
      db.settings
        .put({
          key: `editor_history_${state.activeCardUuid}`,
          value: {
            undoStack: state.undoStack,
            redoStack: state.redoStack,
          },
        })
        .catch((err) => {
          console.error('Failed to flush editor history:', err);
          useToastStore.getState().showToast({
            title: 'Failed to save editor history',
            message: err instanceof Error ? err.message : 'Database error',
            type: 'error',
          });
        });

      if (state.activeCard) {
        db.cards
          .where('uuid')
          .equals(state.activeCardUuid)
          .modify({
            cardData: state.activeCard,
            modification_date: Math.floor(Date.now() / 1000),
          })
          .catch((err) => {
            console.error('Failed to flush active card:', err);
            useToastStore.getState().showToast({
              title: 'Failed to save card',
              message: err instanceof Error ? err.message : 'Database error',
              type: 'error',
            });
          });
      }
    }
  };

  window.addEventListener('beforeunload', flushPendingSave);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushPendingSave();
      }
    });
  }
}
