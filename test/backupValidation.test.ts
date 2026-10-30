// @vitest-environment jsdom
import '../test/setup';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, type StoredCard } from '../src/db';
import {
  createFullBackupJson,
  parseBackupPayload,
  restoreFullBackup,
  type FullBackupData,
} from '../src/io/backup';

function makeCard(uuid: string, cardData: unknown = {
  spec: 'chara_card_v3',
  spec_version: '3.0',
  data: {
    name: 'Test card', description: '', personality: '', scenario: '', first_mes: '',
    mes_example: '', creator_notes: '', system_prompt: '', post_history_instructions: '',
    tags: [], creator: 'Tester', character_version: '1.0', alternate_greetings: [],
    group_only_greetings: [], extensions: {},
  },
}): StoredCard {
  return { uuid, name: 'Test card', tags: [], creator: 'Tester', cardData: cardData as StoredCard['cardData'] };
}

function makeBackup(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 1, exportedAt: new Date().toISOString(), cards: [], lorebooks: [],
    connectionProfiles: [], settings: [], ...overrides,
  };
}

function makeProfile(overrides: Record<string, unknown> = {}) {
  return { uuid: 'profile-1', name: 'Valid profile', provider: 'openai', model: 'gpt-test', ...overrides };
}

describe('backup validation', () => {
  beforeEach(async () => {
    await db.cards.clear();
    await db.lorebooks.clear();
    await db.connectionProfiles.clear();
    await db.settings.clear();
  });

  it('restores a normal full JSON export with the existing counts', async () => {
    await db.cards.add(makeCard('normal-card'));
    await db.connectionProfiles.add(makeProfile() as never);
    const exported = await createFullBackupJson(false);
    await db.cards.clear();
    await db.connectionProfiles.clear();
    const summary = await restoreFullBackup(exported, 'merge');
    expect(summary.cardsCount).toBe(1);
    expect(summary.lorebooksCount).toBe(0);
    expect(summary.profilesCount).toBe(1);
    expect(summary.cardsSkipped).toBe(0);
    expect(summary.errors).toEqual([]);
  });

  it('skips an unsupported provider, names it in warnings, and restores other profiles', async () => {
    const summary = await restoreFullBackup(JSON.stringify(makeBackup({
      connectionProfiles: [
        makeProfile({ uuid: 'bad', name: 'Bad provider', provider: 'bogus' }),
        makeProfile({ uuid: 'good', name: 'Good provider' }),
      ],
    })), 'merge');
    expect(summary.profilesCount).toBe(1);
    expect(summary.errors.join(' ')).toContain('Bad provider');
    expect(await db.connectionProfiles.where('uuid').equals('good').first()).toBeDefined();
    expect(await db.connectionProfiles.where('uuid').equals('bad').first()).toBeUndefined();
  });

  it('skips a profile without a uuid', async () => {
    const summary = await restoreFullBackup(JSON.stringify(makeBackup({
      connectionProfiles: [makeProfile({ uuid: undefined })],
    })), 'merge');
    expect(summary.profilesCount).toBe(0);
    expect(summary.errors.join(' ')).toContain('Valid profile');
    expect(await db.connectionProfiles.count()).toBe(0);
  });

  it('skips a profile with an incorrectly typed numeric field', async () => {
    const summary = await restoreFullBackup(JSON.stringify(makeBackup({
      connectionProfiles: [makeProfile({ temperature: 'hot' })],
    })), 'merge');
    expect(summary.profilesCount).toBe(0);
    expect(summary.errors.join(' ')).toContain('Valid profile');
    expect(await db.connectionProfiles.count()).toBe(0);
  });

  it('preserves unknown profile keys when restoring', async () => {
    await restoreFullBackup(JSON.stringify(makeBackup({
      connectionProfiles: [makeProfile({ customExtra: 'kept' })],
    })), 'merge');
    const stored = await db.connectionProfiles.where('uuid').equals('profile-1').first();
    expect(stored).toMatchObject({ customExtra: 'kept' });
  });

  it('skips malformed setting keys and non-string crypto_mode values but restores normal settings', async () => {
    const summary = await restoreFullBackup(JSON.stringify(makeBackup({
      settings: [
        { key: 42, value: 'bad' }, { key: 'crypto_mode', value: 7 },
        { key: 'app_theme', value: 'dark' },
      ],
    })), 'merge');
    expect(summary.errors.join(' ')).toContain('crypto_mode');
    expect(await db.settings.get('app_theme')).toEqual({ key: 'app_theme', value: 'dark' });
    expect(await db.settings.get('crypto_mode')).toBeUndefined();
    expect(await db.settings.count()).toBe(1);
  });

  it('rejects non-list connectionProfiles and a missing cards list with the existing messages', async () => {
    await expect(restoreFullBackup(JSON.stringify(makeBackup({ connectionProfiles: 'x' })), 'merge'))
      .rejects.toThrow('Invalid backup file: connectionProfiles must be a list.');
    await expect(restoreFullBackup(JSON.stringify({ connectionProfiles: [] }), 'merge'))
      .rejects.toThrow('Invalid backup file: Missing cards list.');
  });

  it('parseBackupPayload returns filtered profiles and settings without warning metadata', async () => {
    const parsed = await parseBackupPayload(JSON.stringify(makeBackup({
      connectionProfiles: [
        makeProfile({ provider: 'bogus', name: 'Bad profile' }),
        makeProfile({ uuid: 'good', name: 'Good profile' }),
      ],
      settings: [{ key: 'crypto_mode', value: 7 }, { key: 'app_theme', value: 'dark' }],
    })));
    expect(parsed.connectionProfiles.map((profile) => profile.name)).toEqual(['Good profile']);
    expect(parsed.settings).toEqual([{ key: 'app_theme', value: 'dark' }]);
    expect(parsed).not.toHaveProperty('warnings');
  });

  it('does not write profiles or settings when the envelope check throws', async () => {
    await expect(restoreFullBackup(JSON.stringify({
      connectionProfiles: [makeProfile()], settings: [{ key: 'app_theme', value: 'dark' }],
    }), 'merge')).rejects.toThrow('Invalid backup file: Missing cards list.');
    expect(await db.connectionProfiles.count()).toBe(0);
    expect(await db.settings.count()).toBe(0);
  });

  it('reports a bad card while restoring the valid card', async () => {
    const payload: FullBackupData = {
      version: 1, exportedAt: new Date().toISOString(),
      cards: [makeCard('valid-card'), makeCard('invalid-card', {})],
      lorebooks: [], connectionProfiles: [], settings: [],
    };
    const summary = await restoreFullBackup(JSON.stringify(payload), 'merge');
    expect(await db.cards.where('uuid').equals('valid-card').first()).toBeDefined();
    expect(summary.cardsSkipped > 0 || summary.errors.length > 0).toBe(true);
  });
});
