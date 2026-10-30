// @vitest-environment jsdom
import '../test/setup';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, type StoredLorebook } from '../src/db';
import { useCardStore } from '../src/store/useCardStore';

function createStoredLorebook(uuid: string, name: string): StoredLorebook {
  return {
    uuid,
    name,
    description: `${name} description`,
    updatedAt: Date.now(),
    lorebook: {
      entries: [],
      extensions: {},
    },
  };
}

describe('lorebook store', () => {
  beforeEach(async () => {
    await db.lorebooks.clear();
    useCardStore.setState({ lorebooks: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads stored lorebooks into the shared store', async () => {
    const lorebook = createStoredLorebook('lorebook-one', 'First Lorebook');
    await db.lorebooks.add(lorebook);

    await useCardStore.getState().loadLorebooksFromDb();

    expect(useCardStore.getState().lorebooks).toEqual([
      expect.objectContaining({
        uuid: 'lorebook-one',
        name: 'First Lorebook',
      }),
    ]);
  });

  it('keeps the result of the latest overlapping load request', async () => {
    const firstLorebook = createStoredLorebook('lorebook-one', 'First Lorebook');
    const secondLorebook = createStoredLorebook('lorebook-two', 'Second Lorebook');
    await db.lorebooks.add(firstLorebook);

    let resolveFirstRequest!: (lorebooks: StoredLorebook[]) => void;
    const firstRequestResult = new Promise<StoredLorebook[]>((resolve) => {
      resolveFirstRequest = resolve;
    });
    const readFromDb = db.lorebooks.toArray.bind(db.lorebooks);
    vi.spyOn(db.lorebooks, 'toArray')
      .mockImplementationOnce(() => Dexie.Promise.resolve(firstRequestResult))
      .mockImplementationOnce(() => readFromDb());

    const firstRequest = useCardStore.getState().loadLorebooksFromDb();
    await db.lorebooks.add(secondLorebook);
    const secondRequest = useCardStore.getState().loadLorebooksFromDb();

    await secondRequest;
    resolveFirstRequest([firstLorebook]);
    await firstRequest;

    expect(useCardStore.getState().lorebooks.map((lorebook) => lorebook.uuid)).toEqual([
      'lorebook-one',
      'lorebook-two',
    ]);
  });
});
