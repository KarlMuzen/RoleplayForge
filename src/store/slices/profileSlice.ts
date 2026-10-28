import type { StateCreator } from 'zustand';
import { db } from '../../db';
import { encryptText } from '../../utils/crypto';
import { PASSKEY_ONLY_SETUP_SENTINEL } from '../../utils/passkeyCrypto';
import { validateAndCleanBaseUrl } from '../../services/llmAdapter';
import { useToastStore } from '../useToastStore';
import type { CardStore, ProfileSlice } from './types';

export const createProfileSlice: StateCreator<CardStore, [], [], ProfileSlice> = (set, get) => ({
  profiles: [],
  activeProfileUuid: null,

  loadProfilesFromDb: async () => {
    try {
      const allProfiles = await db.connectionProfiles.toArray();
      const currentActive = get().activeProfileUuid;
      const currentExists = allProfiles.some((p) => p.uuid === currentActive);

      let targetUuid: string | null = null;
      if (currentActive && currentExists) {
        targetUuid = currentActive;
      } else {
        const defaultProf = allProfiles.find((p) => p.isDefault) || allProfiles[0];
        targetUuid = defaultProf ? defaultProf.uuid : null;
      }

      set({
        profiles: allProfiles,
        activeProfileUuid: targetUuid,
      });
    } catch (err) {
      console.error('Failed to load connection profiles:', err);
    }
  },

  saveProfile: async (profile) => {
    if (!profile.uuid) {
      profile.uuid = crypto.randomUUID();
    }

    // Validate and clean baseUrl if provided
    if (profile.baseUrl && profile.baseUrl.trim()) {
      try {
        profile.baseUrl = validateAndCleanBaseUrl(profile.baseUrl.trim());
      } catch (err) {
        useToastStore.getState().showToast({
          title: 'Invalid Base URL',
          message: err instanceof Error ? err.message : String(err),
          type: 'error',
        });
        throw err;
      }
    }

    // Encrypt API key if needed
    if (profile.apiKey && !profile.apiKey.startsWith('enc.v1.')) {
      let key = get().cryptoKey;
      if (!key && get().isPassphraseSet) {
        // Prompt for passphrase unlock if passphrase is configured but session is locked
        let success = false;
        let attempts = 0;
        const MAX_ATTEMPTS = 3;
        while (!success && attempts < MAX_ATTEMPTS) {
          const pass = await Promise.race([
            new Promise<string | null>((resolve) => {
              set({ decryptionRequest: { resolve } });
            }),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 60000)),
          ]);

          if (!pass) {
            set({ decryptionRequest: null, decryptionError: null });
            throw new Error('Passphrase required to encrypt API key before saving.');
          }

          success = await get().unlockSession(pass);
          if (!success) {
            attempts++;
            if (attempts < MAX_ATTEMPTS) {
              set({
                decryptionError: `Incorrect passphrase. Please try again. (${MAX_ATTEMPTS - attempts} attempts left)`,
              });
            }
          } else {
            set({ decryptionRequest: null, decryptionError: null });
            key = get().cryptoKey;
          }
        }
        if (!key) {
          throw new Error('Session is locked. API key could not be encrypted.');
        }
      } else if (!get().isPassphraseSet) {
        // STRICT SECURITY MANDATE: API keys must never be saved unencrypted in IndexedDB.
        // Prompt user to establish a Master Passphrase to encrypt the API key.
        let success = false;
        while (!success) {
          const pass = await Promise.race([
            new Promise<string | null>((resolve) => {
              set({ passphraseSetupRequest: { resolve } });
            }),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 60000)),
          ]);

          if (!pass) {
            set({ passphraseSetupRequest: null, passphraseSetupError: null });
            throw new Error(
              'A master passphrase is required to encrypt API keys before storing them in IndexedDB on this device.'
            );
          }

          if (pass === PASSKEY_ONLY_SETUP_SENTINEL) {
            key = get().cryptoKey;
            if (!get().isPasskeyOnly || !get().isUnlocked || !key) {
              set({ passphraseSetupRequest: null, passphraseSetupError: null });
              throw new Error('Passkey vault setup did not complete successfully.');
            }
            set({ passphraseSetupRequest: null, passphraseSetupError: null });
            success = true;
            break;
          }

          if (pass.length < 4) {
            set({ passphraseSetupError: 'Passphrase must be at least 4 characters long.' });
            continue;
          }

          try {
            await get().setupPassphrase(pass);
            set({ passphraseSetupRequest: null, passphraseSetupError: null });
            key = get().cryptoKey;
            success = true;
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            set({ passphraseSetupError: `Failed to establish passphrase: ${message}` });
          }
        }
      }

      if (key) {
        profile.apiKey = await encryptText(profile.apiKey, key);
      } else {
        throw new Error('API key encryption failed. Plaintext key storage is strictly disabled for security.');
      }
    }

    await db.transaction('rw', db.connectionProfiles, async () => {
      const allProfiles = await db.connectionProfiles.toArray();
      // If first profile, default to true. Otherwise respect profile.isDefault
      if (allProfiles.length === 0) {
        profile.isDefault = true;
      }

      if (profile.isDefault) {
        for (const p of allProfiles) {
          if (p.id && p.uuid !== profile.uuid && p.isDefault) {
            await db.connectionProfiles.update(p.id, { isDefault: false });
          }
        }
      }

      const existing = await db.connectionProfiles.where('uuid').equals(profile.uuid).first();
      if (existing && existing.id) {
        await db.connectionProfiles.update(existing.id, profile);
      } else {
        await db.connectionProfiles.add(profile);
      }
    });

    if (profile.isDefault || !get().activeProfileUuid) {
      set({ activeProfileUuid: profile.uuid });
    }
    await get().loadProfilesFromDb();
  },

  deleteProfile: async (uuid) => {
    const existing = await db.connectionProfiles.where('uuid').equals(uuid).first();
    if (existing && existing.id) {
      await db.connectionProfiles.delete(existing.id);
      if (get().activeProfileUuid === uuid) {
        set({ activeProfileUuid: null });
      }
      await get().loadProfilesFromDb();
    }
  },

  setActiveProfileUuid: async (uuid) => {
    set({ activeProfileUuid: uuid });
    if (!uuid) return;
    try {
      await db.transaction('rw', db.connectionProfiles, async () => {
        const allProfiles = await db.connectionProfiles.toArray();
        for (const p of allProfiles) {
          if (p.id) {
            const isDef = p.uuid === uuid;
            if (p.isDefault !== isDef) {
              await db.connectionProfiles.update(p.id, { isDefault: isDef });
            }
          }
        }
      });
      const updatedProfiles = await db.connectionProfiles.toArray();
      set({ profiles: updatedProfiles, activeProfileUuid: uuid });
    } catch (err) {
      console.error('Failed to update active profile in IndexedDB:', err);
      useToastStore.getState().showToast({
        title: 'Failed to update active profile',
        message: err instanceof Error ? err.message : 'Database error',
        type: 'error',
      });
    }
  },
});
