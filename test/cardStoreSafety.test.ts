import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, type StoredCard } from '../src/db';
import { createNewDefaultCard } from '../src/utils/cardDefaults';
import { useCardStore } from '../src/store/useCardStore';

const testUuids: string[] = [];
const unrelatedSettingKey = 'cost_tracker_usage';

function uniqueUuid(): string {
  const uuid = `store-safety-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  testUuids.push(uuid);
  return uuid;
}

function makeRecord(uuid: string, snapshots: StoredCard['snapshots'] = []): StoredCard {
  const cardData = createNewDefaultCard(`Character ${uuid}`);
  return {
    uuid,
    name: cardData.data.name,
    tags: cardData.data.tags || [],
    creator: cardData.data.creator || '',
    cardData,
    embeddedAssets: {},
    snapshots,
  };
}

async function seedHistory(uuid: string): Promise<void> {
  await db.settings.put({
    key: `editor_history_${uuid}`,
    value: { undoStack: [], redoStack: [] },
  });
}

beforeEach(async () => {
  const previousTimeout = useCardStore.getState().saveTimeoutId;
  if (previousTimeout) clearTimeout(previousTimeout);
  useCardStore.setState({
    activeCardUuid: null,
    activeCard: null,
    activeCardRecord: null,
    activeCardEmbeddedAssets: {},
    isAssetsDirty: false,
    undoStack: [],
    redoStack: [],
    selectedCardUuids: [],
    assistantChats: {},
    saveTimeoutId: null,
  });
});

afterEach(async () => {
  const timeout = useCardStore.getState().saveTimeoutId;
  if (timeout) clearTimeout(timeout);
  for (const uuid of testUuids.splice(0)) {
    await db.cards.where('uuid').equals(uuid).delete();
    await db.settings.delete(`editor_history_${uuid}`);
  }
  await db.settings.delete(unrelatedSettingKey);
});

describe('card store data safety', () => {
  it('deletes only the target card editor history with deleteCard', async () => {
    const target = uniqueUuid();
    const other = uniqueUuid();
    await db.cards.add(makeRecord(target));
    await db.cards.add(makeRecord(other));
    await seedHistory(target);
    await seedHistory(other);
    await db.settings.put({ key: unrelatedSettingKey, value: { total: 17 } });

    await useCardStore.getState().deleteCard(target);

    expect(await db.settings.get(`editor_history_${target}`)).toBeUndefined();
    expect(await db.settings.get(`editor_history_${other}`)).toBeDefined();
    expect(await db.settings.get(unrelatedSettingKey)).toEqual({
      key: unrelatedSettingKey,
      value: { total: 17 },
    });
  });

  it('deletes selected card histories with bulkDeleteCards and preserves other keys', async () => {
    const first = uniqueUuid();
    const second = uniqueUuid();
    const other = uniqueUuid();
    await db.cards.add(makeRecord(first));
    await db.cards.add(makeRecord(second));
    await db.cards.add(makeRecord(other));
    await Promise.all([seedHistory(first), seedHistory(second), seedHistory(other)]);
    await db.settings.put({ key: unrelatedSettingKey, value: { total: 42 } });
    useCardStore.setState({ selectedCardUuids: [first, second] });

    await useCardStore.getState().bulkDeleteCards();

    expect(await db.settings.get(`editor_history_${first}`)).toBeUndefined();
    expect(await db.settings.get(`editor_history_${second}`)).toBeUndefined();
    expect(await db.settings.get(`editor_history_${other}`)).toBeDefined();
    expect(await db.settings.get(unrelatedSettingKey)).toEqual({
      key: unrelatedSettingKey,
      value: { total: 42 },
    });
  });

  it('makes snapshot restore undoable and updates the active record and persisted history', async () => {
    const uuid = uniqueUuid();
    const snapshotData = createNewDefaultCard('Snapshot version');
    const currentData = createNewDefaultCard('Unsaved current version');
    const record: StoredCard = makeRecord(uuid, [{
      id: 'safety-snapshot',
      name: 'Known good',
      createdAt: Date.now(),
      cardData: snapshotData,
    }]);
    record.cardData = currentData;
    record.name = currentData.data.name;
    await db.cards.add(record);

    useCardStore.setState({
      activeCardUuid: uuid,
      activeCard: currentData,
      activeCardRecord: record,
      undoStack: [],
      redoStack: [{ cardData: createNewDefaultCard('Old redo state') }],
    });
    await seedHistory(uuid);

    await useCardStore.getState().restoreSnapshot('safety-snapshot');

    const state = useCardStore.getState();
    expect(state.activeCard?.data.name).toBe('Snapshot version');
    expect(state.activeCardRecord?.name).toBe('Snapshot version');
    expect(state.undoStack).toHaveLength(1);
    expect(state.undoStack[0].cardData.data.name).toBe('Unsaved current version');
    expect(state.redoStack).toEqual([]);

    const persisted = await db.cards.where('uuid').equals(uuid).first();
    expect(persisted?.name).toBe('Snapshot version');
    expect(persisted?.cardData.data.name).toBe('Snapshot version');
    const history = await db.settings.get(`editor_history_${uuid}`);
    expect(history?.value.undoStack).toHaveLength(1);
    expect(history?.value.redoStack).toEqual([]);
  });
});
