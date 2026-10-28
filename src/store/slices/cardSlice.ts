import type { StateCreator } from 'zustand';
import { db, type StoredCard, type CrucibleVector, type CrucibleScenario, DEFAULT_CRUCIBLE_VECTORS } from '../../db';
import type { CharacterCardV3 } from '../../schemas/cardSchema';
import { createNewDefaultCard } from '../../utils/cardDefaults';
import { useToastStore } from '../useToastStore';
import type { CardStore, CardSlice, UndoState } from './types';

const MAX_UNDO_STACK_SIZE = 50;
let lastUndoPushTime = 0;
let loadCardsRequestId = 0;

export const createCardSlice: StateCreator<CardStore, [], [], CardSlice> = (set, get) => ({
  cards: [],
  isLoadingCards: false,

  activeCardUuid: null,
  activeCard: null,
  activeCardRecord: null,
  activeCardEmbeddedAssets: {},
  isAssetsDirty: false,

  saveState: 'idle',
  saveTimeoutId: null,

  triggerAutosave: () => {
    const { saveTimeoutId } = get();
    if (saveTimeoutId) clearTimeout(saveTimeoutId);

    set({
      saveState: 'saving',
      saveTimeoutId: setTimeout(async () => {
        try {
          await get().saveActiveCardMetadata();
          if (get().saveState !== 'error') {
            set({ saveState: 'saved' });
            // Reset to idle after 2 seconds
            setTimeout(() => set((s) => (s.saveState === 'saved' ? { saveState: 'idle' } : {})), 2000);
          }
        } catch (err) {
          console.error('Autosave failed:', err);
          set({ saveState: 'error' });
          useToastStore.getState().showToast({
            title: 'Autosave failed — changes may be lost',
            message: err instanceof Error ? err.message : 'Database error',
            type: 'error',
          });
        }
      }, 800),
    });
  },

  undoStack: [],
  redoStack: [],

  loadCardsFromDb: async () => {
    const currentReq = ++loadCardsRequestId;
    if (get().cards.length === 0) {
      set({ isLoadingCards: true });
    }
    try {
      const allCards = await db.cards.toArray();
      if (currentReq !== loadCardsRequestId) return;
      allCards.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return (b.modification_date || 0) - (a.modification_date || 0);
      });
      set({ cards: allCards, isLoadingCards: false });
    } catch (error) {
      if (currentReq !== loadCardsRequestId) return;
      console.error('Failed to load cards from IndexedDB:', error);
      set({ isLoadingCards: false });
    }
  },

  selectCardForEditing: async (uuid) => {
    const record = await db.cards.where('uuid').equals(uuid).first();
    if (record) {
      lastUndoPushTime = 0;

      let initialUndoStack: UndoState[] = [];
      let initialRedoStack: UndoState[] = [];
      try {
        const historyRec = await db.settings.get(`editor_history_${uuid}`);
        if (historyRec && historyRec.value) {
          initialUndoStack = historyRec.value.undoStack || [];
          initialRedoStack = historyRec.value.redoStack || [];
        }
      } catch (err) {
        console.error('Failed to load undo history:', err);
      }

      set({
        activeCardUuid: uuid,
        activeCard: record.cardData,
        activeCardRecord: record,
        activeCardEmbeddedAssets: record.embeddedAssets || {},
        isAssetsDirty: false,
        undoStack: initialUndoStack,
        redoStack: initialRedoStack,
      });
    }
  },

  createNewCard: async (name = 'New Character') => {
    const newCard = createNewDefaultCard(name);
    const uuid = crypto.randomUUID();
    const currentCards = get().cards;
    const minOrder = currentCards.length > 0 ? Math.min(...currentCards.map((c) => c.order ?? 0)) : 0;
    const record: StoredCard = {
      uuid,
      name: newCard.data.name,
      tags: newCard.data.tags || [],
      creator: newCard.data.creator || '',
      creation_date: newCard.data.creation_date,
      modification_date: newCard.data.modification_date,
      order: minOrder - 1,
      cardData: newCard,
      embeddedAssets: {},
      testSuites: DEFAULT_CRUCIBLE_VECTORS,
    };

    await db.cards.add(record);
    await get().loadCardsFromDb();
    await get().selectCardForEditing(uuid);
    return uuid;
  },

  createVariant: async (sourceUuid: string, label = 'Variant'): Promise<string> => {
    const source = await db.cards.where('uuid').equals(sourceUuid).first();
    if (!source) {
      throw new Error(`Source card with UUID ${sourceUuid} not found`);
    }
    const newUuid = crypto.randomUUID
      ? crypto.randomUUID()
      : `variant_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const now = Math.floor(Date.now() / 1000);

    const cleanLabel = label.trim() || 'Variant';
    const variantName = `${source.name} (${cleanLabel})`;

    // Deep-clone cardData, testSuites, scenarios, embeddedAssets
    const clonedCardData: CharacterCardV3 = JSON.parse(JSON.stringify(source.cardData));
    if (clonedCardData.data) {
      clonedCardData.data.name = variantName;
      clonedCardData.data.modification_date = now;
    }

    const clonedTestSuites: CrucibleVector[] = source.testSuites
      ? JSON.parse(JSON.stringify(source.testSuites))
      : JSON.parse(JSON.stringify(DEFAULT_CRUCIBLE_VECTORS));

    const clonedScenarios: CrucibleScenario[] = source.scenarios
      ? JSON.parse(JSON.stringify(source.scenarios))
      : [];

    const clonedAssets: Record<string, Uint8Array> = {};
    if (source.embeddedAssets) {
      for (const [k, v] of Object.entries(source.embeddedAssets)) {
        clonedAssets[k] = new Uint8Array(v);
      }
    }

    const currentCards = get().cards;
    const minOrder = currentCards.length > 0 ? Math.min(...currentCards.map((c) => c.order ?? 0)) : 0;

    const variantRecord: StoredCard = {
      uuid: newUuid,
      name: variantName,
      tags: [...(source.tags || [])],
      creator: source.creator || '',
      creation_date: now,
      modification_date: now,
      order: minOrder - 1,
      cardData: clonedCardData,
      embeddedAssets: clonedAssets,
      testSuites: clonedTestSuites,
      scenarios: clonedScenarios,
      snapshots: [],
      variantOf: sourceUuid,
      variantLabel: cleanLabel,
      avatarUrl: source.avatarUrl,
      schemaVersion: 5,
    };

    await db.cards.add(variantRecord);
    await get().loadCardsFromDb();
    await get().selectCardForEditing(newUuid);
    return newUuid;
  },

  saveActiveCard: async () => {
    const { activeCardUuid, activeCard, activeCardEmbeddedAssets, isAssetsDirty } = get();
    if (!activeCardUuid || !activeCard) return;

    const now = Math.floor(Date.now() / 1000);
    const updatedCard: CharacterCardV3 = {
      ...activeCard,
      data: {
        ...activeCard.data,
        modification_date: now,
      },
    };

    const existingRecord = await db.cards.where('uuid').equals(activeCardUuid).first();
    if (existingRecord && existingRecord.id) {
      const updatePayload: Partial<StoredCard> = {
        name: updatedCard.data.name,
        tags: updatedCard.data.tags || [],
        creator: updatedCard.data.creator || '',
        modification_date: now,
        cardData: updatedCard,
      };

      if (isAssetsDirty) {
        updatePayload.embeddedAssets = activeCardEmbeddedAssets;
      }

      await db.cards.update(existingRecord.id, updatePayload);

      if (isAssetsDirty) {
        set({ isAssetsDirty: false });
      }

      await db.settings.put({
        key: `editor_history_${activeCardUuid}`,
        value: {
          undoStack: get().undoStack,
          redoStack: get().redoStack,
        },
      });
    }

    set({ activeCard: updatedCard });
    await get().loadCardsFromDb();
  },

  saveActiveCardMetadata: async () => {
    try {
      const { activeCardUuid, activeCard } = get();
      if (!activeCardUuid || !activeCard) return;

      const now = Math.floor(Date.now() / 1000);
      const updatedCard: CharacterCardV3 = {
        ...activeCard,
        data: {
          ...activeCard.data,
          modification_date: now,
        },
      };

      const existingRecord = await db.cards.where('uuid').equals(activeCardUuid).first();
      if (existingRecord && existingRecord.id) {
        await db.cards.update(existingRecord.id, {
          name: updatedCard.data.name,
          tags: updatedCard.data.tags || [],
          creator: updatedCard.data.creator || '',
          modification_date: now,
          cardData: updatedCard,
        });

        // Persist undo/redo history to settings
        await db.settings.put({
          key: `editor_history_${activeCardUuid}`,
          value: {
            undoStack: get().undoStack,
            redoStack: get().redoStack,
          },
        });
      }

      set({ activeCard: updatedCard });
      await get().loadCardsFromDb();
    } catch (err) {
      console.error('Failed to save card metadata:', err);
      set({ saveState: 'error' });
      useToastStore.getState().showToast({
        title: 'Failed to save card',
        message: err instanceof Error ? err.message : 'Database error',
        type: 'error',
      });
    }
  },

  updateActiveCardData: (updater) => {
    const currentCard = get().activeCard;
    if (!currentCard) return;

    const now = Date.now();
    const shouldPushUndo = get().undoStack.length === 0 || now - lastUndoPushTime > 500;
    lastUndoPushTime = now;

    if (shouldPushUndo) {
      set((state) => ({
        undoStack: [...state.undoStack, { cardData: JSON.parse(JSON.stringify(currentCard)) }].slice(
          -MAX_UNDO_STACK_SIZE
        ),
        redoStack: [],
      }));
    } else {
      set({ redoStack: [] });
    }

    const nextCard = updater(currentCard);
    set({ activeCard: nextCard });
    get().triggerAutosave();
  },

  updateActiveCardTestSuites: async (testSuites: CrucibleVector[]) => {
    const { activeCardUuid, activeCardRecord, cards } = get();
    if (!activeCardUuid) return;

    if (activeCardRecord) {
      set({
        activeCardRecord: {
          ...activeCardRecord,
          testSuites,
        },
      });
    }

    const updatedCards = cards.map((c) => (c.uuid === activeCardUuid ? { ...c, testSuites } : c));
    set({ cards: updatedCards });

    const existingRecord = await db.cards.where('uuid').equals(activeCardUuid).first();
    if (existingRecord && existingRecord.id) {
      await db.cards.update(existingRecord.id, { testSuites });
    }
  },

  updateActiveCardScenarios: async (scenarios: CrucibleScenario[]) => {
    const { activeCardUuid, activeCardRecord, cards } = get();
    if (!activeCardUuid) return;

    if (activeCardRecord) {
      set({
        activeCardRecord: {
          ...activeCardRecord,
          scenarios,
        },
      });
    }

    const updatedCards = cards.map((c) => (c.uuid === activeCardUuid ? { ...c, scenarios } : c));
    set({ cards: updatedCards });

    const existingRecord = await db.cards.where('uuid').equals(activeCardUuid).first();
    if (existingRecord && existingRecord.id) {
      await db.cards.update(existingRecord.id, { scenarios });
    }
  },

  undo: () => {
    const { undoStack, activeCard } = get();
    if (undoStack.length === 0 || !activeCard) return;

    lastUndoPushTime = 0;
    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    set((state) => ({
      activeCard: JSON.parse(JSON.stringify(previousState.cardData)),
      undoStack: newUndoStack,
      redoStack: [{ cardData: JSON.parse(JSON.stringify(activeCard)) }, ...state.redoStack].slice(
        0,
        MAX_UNDO_STACK_SIZE
      ),
    }));

    get().saveActiveCardMetadata();
  },

  redo: () => {
    const { redoStack, activeCard } = get();
    if (redoStack.length === 0 || !activeCard) return;

    lastUndoPushTime = 0;
    const nextState = redoStack[0];
    const newRedoStack = redoStack.slice(1);

    set((state) => ({
      activeCard: JSON.parse(JSON.stringify(nextState.cardData)),
      undoStack: [...state.undoStack, { cardData: JSON.parse(JSON.stringify(activeCard)) }].slice(
        -MAX_UNDO_STACK_SIZE
      ),
      redoStack: newRedoStack,
    }));

    get().saveActiveCardMetadata();
  },

  deleteCard: async (uuid) => {
    const record = await db.cards.where('uuid').equals(uuid).first();
    if (record && record.id) {
      await db.cards.delete(record.id);
      if (get().activeCardUuid === uuid) {
        set({ activeCardUuid: null, activeCard: null, activeCardRecord: null });
      }

      // Cleanup assistant chat for deleted character
      const updatedChats = { ...get().assistantChats };
      delete updatedChats[uuid];
      set({ assistantChats: updatedChats });
      try {
        await db.settings.put({ key: 'assistant_chats', value: updatedChats });
      } catch (e) {
        console.error('Failed to clean up assistant chat for deleted card:', e);
        useToastStore.getState().showToast({
          title: 'Failed to update assistant chat history',
          message: e instanceof Error ? e.message : 'Database error',
          type: 'error',
        });
      }

      await get().loadCardsFromDb();
    }
  },

  bulkDeleteCards: async () => {
    const uuids = get().selectedCardUuids;
    const updatedChats = { ...get().assistantChats };
    for (const uuid of uuids) {
      const record = await db.cards.where('uuid').equals(uuid).first();
      if (record && record.id) {
        await db.cards.delete(record.id);
      }
      delete updatedChats[uuid];
    }
    set({ selectedCardUuids: [], assistantChats: updatedChats });
    try {
      await db.settings.put({ key: 'assistant_chats', value: updatedChats });
    } catch (e) {
      console.error('Failed to clean up assistant chats for bulk deleted cards:', e);
      useToastStore.getState().showToast({
        title: 'Failed to update assistant chat history',
        message: e instanceof Error ? e.message : 'Database error',
        type: 'error',
      });
    }
    await get().loadCardsFromDb();
  },

  createSnapshot: async (name: string) => {
    const { activeCardUuid, activeCard } = get();
    if (!activeCardUuid || !activeCard) return;
    const record = await db.cards.where('uuid').equals(activeCardUuid).first();
    if (!record || !record.id) return;

    const newSnapshot = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      cardData: JSON.parse(JSON.stringify(activeCard)),
    };

    const snapshots = [...(record.snapshots || []), newSnapshot];
    await db.cards.update(record.id, { snapshots });
    await get().loadCardsFromDb();
  },

  restoreSnapshot: async (snapshotId: string) => {
    const { activeCardUuid } = get();
    if (!activeCardUuid) return;
    const record = await db.cards.where('uuid').equals(activeCardUuid).first();
    if (!record || !record.id || !record.snapshots) return;

    const snapshot = record.snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return;

    // Create deep copy to avoid reference issues
    const restoredData = JSON.parse(JSON.stringify(snapshot.cardData));
    await db.cards.update(record.id, { cardData: restoredData });
    lastUndoPushTime = 0;
    set({ activeCard: restoredData, undoStack: [], redoStack: [] });
    await get().loadCardsFromDb();
  },

  deleteSnapshot: async (snapshotId: string) => {
    const { activeCardUuid } = get();
    if (!activeCardUuid) return;
    const record = await db.cards.where('uuid').equals(activeCardUuid).first();
    if (!record || !record.id || !record.snapshots) return;

    const snapshots = record.snapshots.filter((s) => s.id !== snapshotId);
    await db.cards.update(record.id, { snapshots });
    await get().loadCardsFromDb();
  },

  reorderCards: async (reorderedCards: StoredCard[]) => {
    const updatedCards = reorderedCards.map((card, idx) => ({
      ...card,
      order: idx,
    }));

    set({ cards: updatedCards });

    try {
      await db.transaction('rw', db.cards, async () => {
        for (const card of updatedCards) {
          if (card.id) {
            await db.cards.update(card.id, { order: card.order });
          }
        }
      });
    } catch (err) {
      console.error('Failed to save card order to IndexedDB:', err);
      useToastStore.getState().showToast({
        title: 'Failed to save card order',
        message: err instanceof Error ? err.message : 'Database error',
        type: 'error',
      });
    }
  },

  importCardRecord: async (card, embeddedAssets = {}, overwriteUuid) => {
    const currentCards = get().cards;

    if (overwriteUuid) {
      const existing = await db.cards.where('uuid').equals(overwriteUuid).first();
      if (existing && existing.id) {
        await db.cards.update(existing.id, {
          name: card.data.name || 'Imported Card',
          tags: card.data.tags || [],
          creator: card.data.creator || '',
          modification_date: Math.floor(Date.now() / 1000),
          cardData: card,
          embeddedAssets,
        });
        await get().loadCardsFromDb();
        return overwriteUuid;
      }
    }

    const uuid = crypto.randomUUID();
    const minOrder = currentCards.length > 0 ? Math.min(...currentCards.map((c) => c.order ?? 0)) : 0;
    const record: StoredCard = {
      uuid,
      name: card.data.name || 'Imported Card',
      tags: card.data.tags || [],
      creator: card.data.creator || '',
      creation_date: card.data.creation_date || Math.floor(Date.now() / 1000),
      modification_date: card.data.modification_date || Math.floor(Date.now() / 1000),
      order: minOrder - 1,
      cardData: card,
      embeddedAssets,
      testSuites: DEFAULT_CRUCIBLE_VECTORS,
    };

    await db.cards.add(record);
    await get().loadCardsFromDb();
    return uuid;
  },

  setCardCoverImage: async (imageBytes: Uint8Array, mimeType = 'image/png') => {
    const { activeCard, activeCardEmbeddedAssets, updateActiveCardData, saveActiveCard } = get();
    if (!activeCard) return;

    const ext = mimeType.split('/')[1] || 'png';
    const uri = `embeded://icon/main.${ext}`;

    const existingAssets = activeCard.data.assets || [];
    const filteredAssets = existingAssets.filter((a) => !(a.type === 'icon' && a.name === 'main'));
    filteredAssets.unshift({
      type: 'icon',
      uri,
      name: 'main',
      ext,
    });

    set({
      activeCardEmbeddedAssets: {
        ...activeCardEmbeddedAssets,
        [uri]: imageBytes,
      },
      isAssetsDirty: true,
    });

    updateActiveCardData((c) => ({
      ...c,
      data: {
        ...c.data,
        assets: filteredAssets,
      },
    }));

    await saveActiveCard();
  },

  removeCardCoverImage: async () => {
    const { activeCard, activeCardEmbeddedAssets, updateActiveCardData, saveActiveCard } = get();
    if (!activeCard) return;

    const newAssets = (activeCard.data.assets || []).filter((a) => !(a.type === 'icon' && a.name === 'main'));
    const newEmbedded = { ...activeCardEmbeddedAssets };
    delete newEmbedded['embeded://icon/main.png'];
    delete newEmbedded['embeded://icon/main.jpg'];
    delete newEmbedded['embeded://icon/main.webp'];
    delete newEmbedded['embeded://icon/main.jpeg'];

    set({
      activeCardEmbeddedAssets: newEmbedded,
      isAssetsDirty: true,
    });

    updateActiveCardData((c) => ({
      ...c,
      data: {
        ...c.data,
        assets: newAssets,
      },
    }));

    await saveActiveCard();
  },
});
