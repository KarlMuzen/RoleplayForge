import type { StateCreator } from 'zustand';
import { db, type ConnectionProfile } from '../../db';
import {
  deriveKey,
  hashKey,
  generateSalt,
  encryptText,
  decryptText,
  hex2buf,
  buf2hex,
} from '../../utils/crypto';
import {
  isPasskeySupported,
  enrollPasskey,
  unlockWithPasskey,
} from '../../utils/passkeyCrypto';
import type { CardStore, SessionSlice } from './types';

let hasRequestedStoragePersist = false;
function requestPersistentStorageOnce() {
  if (hasRequestedStoragePersist) return;
  hasRequestedStoragePersist = true;
  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }
}

export const createSessionSlice: StateCreator<CardStore, [], [], SessionSlice> = (set, get) => ({
  isPassphraseSet: false,
  isPasskeyOnly: false,
  hasRecoveryKey: false,
  pendingRecoveryCode: null,
  isUnlocked: false,
  cryptoKey: null,
  isPasskeySupported: isPasskeySupported(),
  isPasskeyEnrolled: false,
  decryptionRequest: null,
  decryptionError: null,
  passphraseSetupRequest: null,
  passphraseSetupError: null,

  lockSession: () => set({ isUnlocked: false, cryptoKey: null }),

  checkPassphraseSetup: async () => {
    const saltRec = await db.settings.get('crypto_salt');
    const hashRec = await db.settings.get('crypto_hash');
    const passkeyCredRec = await db.settings.get('passkey_credential_id');
    const passkeyWrappedRec = await db.settings.get('passkey_wrapped_key');
    const passkeySaltRec = await db.settings.get('passkey_prf_salt');
    const recoverySaltRec = await db.settings.get('crypto_recovery_salt');
    const recoveryWrappedRec = await db.settings.get('crypto_recovery_wrapped_key');
    const modeRec = await db.settings.get('crypto_mode');
    const isPasskeyOnly = modeRec?.value === 'passkey-only-v1'
      && !!(passkeyCredRec?.value && passkeyWrappedRec?.value && passkeySaltRec?.value);

    set({
      isPassphraseSet: !!(saltRec && hashRec) || isPasskeyOnly,
      isPasskeyOnly,
      hasRecoveryKey: !!(recoverySaltRec?.value && recoveryWrappedRec?.value),
      isPasskeySupported: isPasskeySupported(),
      isPasskeyEnrolled: !!(passkeyCredRec?.value && passkeyWrappedRec?.value && passkeySaltRec?.value),
    });
  },

  setupPassphrase: async (passphrase: string) => {
    const salt = await generateSalt();
    const key = await deriveKey(passphrase, salt, 600000);
    const hash = await hashKey(key);
    await db.transaction('rw', db.settings, db.connectionProfiles, async () => {
      await db.settings.delete('crypto_mode');
      await db.settings.delete('crypto_recovery_salt');
      await db.settings.delete('crypto_recovery_wrapped_key');
      await db.settings.put({ key: 'crypto_salt', value: buf2hex(salt) });
      await db.settings.put({ key: 'crypto_hash', value: hash });

      // Encrypt existing plaintext keys
      const profiles = await db.connectionProfiles.toArray();
      for (const p of profiles) {
        if (p.apiKey && !p.apiKey.startsWith('enc.v1.')) {
          const enc = await encryptText(p.apiKey, key);
          await db.connectionProfiles.update(p.id!, { apiKey: enc });
        }
      }
    });

    set({
      isPassphraseSet: true,
      isPasskeyOnly: false,
      hasRecoveryKey: false,
      pendingRecoveryCode: null,
      isPasskeyEnrolled: false,
      isUnlocked: true,
      cryptoKey: key,
      passphraseSetupRequest: null,
      passphraseSetupError: null,
    });
    requestPersistentStorageOnce();
    await get().loadProfilesFromDb();
  },

  setupPasskeyProtection: async () => {
    if (!get().isPasskeySupported) return null;

    // Create a random vault key: users do not need to invent a master passphrase.
    const rawMasterKey = crypto.getRandomValues(new Uint8Array(32));
    const key = await crypto.subtle.importKey(
      'raw',
      rawMasterKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // The passkey wraps the vault key through the WebAuthn PRF extension.
    const passkey = await enrollPasskey(rawMasterKey);
    if (!passkey) return null;

    // Generate a 256-bit offline recovery code and store only a wrapped vault key.
    const recoveryKeyBytes = crypto.getRandomValues(new Uint8Array(32));
    const recoveryKeyRaw = buf2hex(recoveryKeyBytes).toUpperCase();
    const recoveryCode = recoveryKeyRaw.match(/.{1,4}/g)!.join('-');
    const recoverySalt = await generateSalt();
    const recoveryWrappingKey = await deriveKey(recoveryKeyRaw, recoverySalt, 600000);
    const recoveryIv = crypto.getRandomValues(new Uint8Array(12));
    const recoveryCiphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: recoveryIv },
      recoveryWrappingKey,
      rawMasterKey
    );
    const recoveryWrappedBytes = new Uint8Array(recoveryIv.length + recoveryCiphertext.byteLength);
    recoveryWrappedBytes.set(recoveryIv, 0);
    recoveryWrappedBytes.set(new Uint8Array(recoveryCiphertext), recoveryIv.length);

    await db.transaction('rw', db.settings, db.connectionProfiles, async () => {
      // Preserve the no-plaintext-at-rest invariant for any existing profile.
      const profiles = await db.connectionProfiles.toArray();
      for (const profile of profiles) {
        if (profile.id && profile.apiKey && !profile.apiKey.startsWith('enc.v1.')) {
          await db.connectionProfiles.update(profile.id, {
            apiKey: await encryptText(profile.apiKey, key),
          });
        }
      }

      await db.settings.delete('crypto_salt');
      await db.settings.delete('crypto_hash');
      await db.settings.put({ key: 'crypto_mode', value: 'passkey-only-v1' });
      await db.settings.put({ key: 'passkey_credential_id', value: passkey.credentialIdB64 });
      await db.settings.put({ key: 'passkey_wrapped_key', value: passkey.wrappedKeyHex });
      await db.settings.put({ key: 'passkey_prf_salt', value: passkey.prfSaltHex });
      await db.settings.put({ key: 'crypto_recovery_salt', value: buf2hex(recoverySalt) });
      await db.settings.put({
        key: 'crypto_recovery_wrapped_key',
        value: buf2hex(recoveryWrappedBytes),
      });
    });

    set({
      isPassphraseSet: true,
      isPasskeyOnly: true,
      hasRecoveryKey: true,
      isPasskeyEnrolled: true,
      isUnlocked: true,
      cryptoKey: key,
      pendingRecoveryCode: recoveryCode,
      passphraseSetupError: null,
    });
    requestPersistentStorageOnce();
    await get().loadProfilesFromDb();
    return recoveryCode;
  },

  unlockSession: async (passphrase: string) => {
    const saltRec = await db.settings.get('crypto_salt');
    const hashRec = await db.settings.get('crypto_hash');
    if (!saltRec || !hashRec) return false;

    const salt = hex2buf(saltRec.value);

    // Try standard 600,000 iterations first
    let key = await deriveKey(passphrase, salt, 600000);
    let hash = await hashKey(key);
    if (hash === hashRec.value) {
      set({ isUnlocked: true, cryptoKey: key });
      requestPersistentStorageOnce();
      return true;
    }

    // Try legacy 100,000 iterations fallback for existing passphrases
    key = await deriveKey(passphrase, salt, 100000);
    hash = await hashKey(key);
    if (hash === hashRec.value) {
      set({ isUnlocked: true, cryptoKey: key });
      requestPersistentStorageOnce();
      return true;
    }

    return false;
  },

  requestSessionUnlock: async () => {
    if (get().isUnlocked && get().cryptoKey) return true;

    const MAX_ATTEMPTS = 3;
    let attempts = 0;
    while (attempts < MAX_ATTEMPTS) {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const pass = await Promise.race([
        new Promise<string | null>((resolve) => {
          set({ decryptionRequest: { resolve } });
        }),
        new Promise<null>((resolve) => {
          timeoutId = setTimeout(() => resolve(null), 60000);
        }),
      ]);
      if (timeoutId) clearTimeout(timeoutId);

      // A passkey can unlock the session and resolve the same dialog with an empty string.
      if (get().isUnlocked && get().cryptoKey) {
        set({ decryptionRequest: null, decryptionError: null });
        return true;
      }
      if (!pass) {
        set({ decryptionRequest: null, decryptionError: null });
        return false;
      }

      if (await get().unlockSession(pass)) {
        set({ decryptionRequest: null, decryptionError: null });
        return true;
      }

      attempts++;
      if (attempts < MAX_ATTEMPTS) {
        set({
          decryptionError: `Incorrect passphrase. Please try again. (${MAX_ATTEMPTS - attempts} attempts left)`,
        });
      }
    }

    set({ decryptionRequest: null, decryptionError: null });
    return false;
  },

  enrollPasskeyUnlock: async () => {
    const { isUnlocked, cryptoKey } = get();
    if (!isUnlocked || !cryptoKey) return false;

    try {
      const rawBytesBuffer = await crypto.subtle.exportKey('raw', cryptoKey);
      const rawBytes = new Uint8Array(rawBytesBuffer);
      const result = await enrollPasskey(rawBytes);
      if (!result) return false;

      await db.transaction('rw', db.settings, async () => {
        await db.settings.put({ key: 'passkey_credential_id', value: result.credentialIdB64 });
        await db.settings.put({ key: 'passkey_wrapped_key', value: result.wrappedKeyHex });
        await db.settings.put({ key: 'passkey_prf_salt', value: result.prfSaltHex });
      });

      set({ isPasskeyEnrolled: true });
      return true;
    } catch (_err) {
      return false;
    }
  },

  unlockWithPasskeyAction: async () => {
    try {
      const passkeyCredRec = await db.settings.get('passkey_credential_id');
      const passkeyWrappedRec = await db.settings.get('passkey_wrapped_key');
      const passkeySaltRec = await db.settings.get('passkey_prf_salt');

      if (!passkeyCredRec?.value || !passkeyWrappedRec?.value || !passkeySaltRec?.value) {
        return false;
      }

      const rawMasterKeyBytes = await unlockWithPasskey(
        passkeyCredRec.value,
        passkeySaltRec.value,
        passkeyWrappedRec.value
      );

      if (!rawMasterKeyBytes) {
        return false;
      }

      const hashRec = await db.settings.get('crypto_hash');
      const importedKey = await crypto.subtle.importKey(
        'raw',
        rawMasterKeyBytes,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      if (hashRec?.value) {
        const keyHash = await hashKey(importedKey);
        if (keyHash !== hashRec.value) {
          return false;
        }
      }

      set({ isUnlocked: true, cryptoKey: importedKey, decryptionRequest: null, decryptionError: null });
      requestPersistentStorageOnce();
      return true;
    } catch (_err) {
      return false;
    }
  },

  removePasskeyUnlock: async () => {
    await db.transaction('rw', db.settings, async () => {
      await db.settings.delete('passkey_credential_id');
      await db.settings.delete('passkey_wrapped_key');
      await db.settings.delete('passkey_prf_salt');
    });
    set({ isPasskeyEnrolled: false });
  },

  clearPassphrase: async () => {
    await db.transaction('rw', db.settings, db.connectionProfiles, async () => {
      await db.settings.delete('crypto_salt');
      await db.settings.delete('crypto_hash');
      await db.settings.delete('passkey_credential_id');
      await db.settings.delete('passkey_wrapped_key');
      await db.settings.delete('passkey_prf_salt');

      // For strict security: sanitize/redact all API keys from profiles so no raw or orphan encrypted keys remain in disk
      const profiles = await db.connectionProfiles.toArray();
      for (const p of profiles) {
        if (p.apiKey) {
          await db.connectionProfiles.update(p.id!, { apiKey: undefined });
        }
      }
    });

    set({ isPassphraseSet: false, isUnlocked: false, cryptoKey: null, isPasskeyEnrolled: false });
    await get().loadProfilesFromDb();
  },

  getDecryptedApiKey: async (profile: ConnectionProfile, allowPrompt = true) => {
    if (!profile.apiKey) return undefined;
    if (profile.apiKey.startsWith('enc.v1.')) {
      let key = get().cryptoKey;
      if (!key) {
        if (!allowPrompt) {
          return undefined;
        }
        let success = false;
        let attempts = 0;
        const MAX_ATTEMPTS = 3;
        while (!success) {
          if (get().cryptoKey) {
            success = true;
            key = get().cryptoKey;
            set({ decryptionRequest: null, decryptionError: null });
            break;
          }
          if (attempts >= MAX_ATTEMPTS) {
            set({ decryptionRequest: null, decryptionError: null });
            throw new Error('Too many incorrect passphrase attempts.');
          }
          const pass = await Promise.race([
            new Promise<string | null>((resolve) => {
              set({ decryptionRequest: { resolve } });
            }),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 60000)),
          ]);

          if (get().cryptoKey) {
            success = true;
            key = get().cryptoKey;
            set({ decryptionRequest: null, decryptionError: null });
            break;
          }

          if (!pass) {
            set({ decryptionRequest: null, decryptionError: null });
            throw new Error('Passphrase required to unlock API keys.');
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
      }
      if (!key) throw new Error('Session is locked.');
      try {
        return await decryptText(profile.apiKey, key);
      } catch (_e) {
        throw new Error('Failed to decrypt API key. Wrong passphrase or corrupted data.');
      }
    }
    return profile.apiKey;
  },
});
