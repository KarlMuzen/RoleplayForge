import type { StateCreator } from 'zustand';
import { db } from '../../db';
import { useToastStore } from '../useToastStore';
import type { CardStore, AssistantSlice } from './types';

export const createAssistantSlice: StateCreator<CardStore, [], [], AssistantSlice> = (set, get) => ({
  assistantChats: {},

  loadAssistantChatsFromDb: async () => {
    try {
      const rec = await db.settings.get('assistant_chats');
      if (rec && rec.value && typeof rec.value === 'object') {
        set({ assistantChats: rec.value });
      }
    } catch (e) {
      console.error('Failed to load assistant chats from DB:', e);
    }
  },

  saveAssistantMessages: async (cardUuid, messages) => {
    const key = cardUuid || 'global';
    const updated = {
      ...get().assistantChats,
      [key]: messages,
    };
    set({ assistantChats: updated });
    try {
      await db.settings.put({ key: 'assistant_chats', value: updated });
    } catch (e) {
      console.error('Failed to persist assistant chat to DB:', e);
      useToastStore.getState().showToast({
        title: 'Failed to save assistant chat',
        message: e instanceof Error ? e.message : 'Database error',
        type: 'error',
      });
    }
  },

  clearAssistantChat: async (cardUuid) => {
    const key = cardUuid || 'global';
    const updated = { ...get().assistantChats };
    delete updated[key];
    set({ assistantChats: updated });
    try {
      await db.settings.put({ key: 'assistant_chats', value: updated });
    } catch (e) {
      console.error('Failed to clear assistant chat in DB:', e);
      useToastStore.getState().showToast({
        title: 'Failed to clear assistant chat',
        message: e instanceof Error ? e.message : 'Database error',
        type: 'error',
      });
    }
  },
});
