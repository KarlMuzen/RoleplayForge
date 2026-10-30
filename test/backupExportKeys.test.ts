// @vitest-environment jsdom
import '../test/setup';
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { db } from '../src/db';
import { createFullBackupJson, type FullBackupData } from '../src/io/backup';
import { BackupRestoreSection } from '../src/components/settings/BackupRestoreSection';
import { useCardStore } from '../src/store/useCardStore';

describe('backup export API key inclusion', () => {
  beforeEach(async () => {
    await db.cards.clear();
    await db.lorebooks.clear();
    await db.connectionProfiles.clear();
    await db.settings.clear();
    useCardStore.setState({ isPasskeyOnly: false });
  });

  async function seedBackupData() {
    await db.connectionProfiles.put({
      uuid: 'profile-1',
      name: 'Primary profile',
      provider: 'openai',
      model: 'gpt-test',
      apiKey: 'enc.v1.x',
      isDefault: true,
    });
    await db.settings.bulkPut([
      { key: 'crypto_mode', value: 'passkey-only-v1' },
      { key: 'passkey_credential_id', value: 'credential-id' },
      { key: 'crypto_salt', value: 'vault-salt' },
      { key: 'app_theme', value: 'dark' },
    ]);
  }

  it('redacts API keys and device vault settings when keys are left out', async () => {
    await seedBackupData();

    const backup = JSON.parse(await createFullBackupJson(false)) as FullBackupData & {
      connectionProfiles: Array<{ apiKey?: string; apiKeyRedacted?: boolean }>;
    };
    const profile = backup.connectionProfiles[0];
    const settingKeys = (backup.settings || []).map((setting) => setting.key);

    expect(profile).not.toHaveProperty('apiKey');
    expect(profile.apiKeyRedacted).toBe(true);
    expect(settingKeys).not.toContain('crypto_mode');
    expect(settingKeys).not.toContain('passkey_credential_id');
    expect(settingKeys).not.toContain('crypto_salt');
    expect(settingKeys).toContain('app_theme');
  });

  it('keeps API keys and device vault settings when explicitly included', async () => {
    await seedBackupData();

    const backup = JSON.parse(await createFullBackupJson(true)) as FullBackupData;
    const settingKeys = (backup.settings || []).map((setting) => setting.key);

    expect(backup.connectionProfiles[0].apiKey).toBe('enc.v1.x');
    expect(settingKeys).toContain('crypto_mode');
    expect(settingKeys).toContain('passkey_credential_id');
    expect(settingKeys).toContain('crypto_salt');
  });

  it('defaults the export checkbox from passkey-only vault state when the modal opens', () => {
    const props = {
      profiles: [],
      loadCardsFromDb: async () => {},
      loadProfilesFromDb: async () => {},
    };

    useCardStore.setState({ isPasskeyOnly: true });
    const firstRender = render(<BackupRestoreSection {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /Export Backup \(JSON\)/i }));
    expect(screen.getByRole('checkbox', { name: 'Include API keys in this backup' })).not.toBeChecked();
    firstRender.unmount();

    useCardStore.setState({ isPasskeyOnly: false });
    render(<BackupRestoreSection {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /Export Backup \(JSON\)/i }));
    expect(screen.getByRole('checkbox', { name: 'Include API keys in this backup' })).toBeChecked();
  });
});
