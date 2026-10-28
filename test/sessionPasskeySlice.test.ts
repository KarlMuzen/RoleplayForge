// @vitest-environment jsdom
import '../test/setup';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../src/db';
import { useCardStore } from '../src/store/useCardStore';
import * as passkeyCrypto from '../src/utils/passkeyCrypto';
import { encryptText, decryptText } from '../src/utils/crypto';

describe('sessionSlice - Passkey Integration', () => {
  beforeEach(async () => {
    await db.settings.clear();
    await db.connectionProfiles.clear();
    useCardStore.setState({
      isPassphraseSet: false,
      isPasskeyOnly: false,
      hasRecoveryKey: false,
      pendingRecoveryCode: null,
      isUnlocked: false,
      cryptoKey: null,
      isPasskeySupported: true,
      isPasskeyEnrolled: false,
      decryptionRequest: null,
      decryptionError: null,
    });
  });

  it('enrolls passkey and records settings in db', async () => {
    // Setup passphrase and unlock session
    await useCardStore.getState().setupPassphrase('test-passphrase-123');
    expect(useCardStore.getState().isUnlocked).toBe(true);

    const mockEnroll = vi.spyOn(passkeyCrypto, 'enrollPasskey').mockResolvedValue({
      credentialIdB64: 'mockCredIdB64==',
      wrappedKeyHex: 'abcdef0123456789',
      prfSaltHex: '1122334455667788',
    });

    const enrolled = await useCardStore.getState().enrollPasskeyUnlock();
    expect(enrolled).toBe(true);
    expect(useCardStore.getState().isPasskeyEnrolled).toBe(true);

    const credRec = await db.settings.get('passkey_credential_id');
    const wrapRec = await db.settings.get('passkey_wrapped_key');
    const saltRec = await db.settings.get('passkey_prf_salt');

    expect(credRec?.value).toBe('mockCredIdB64==');
    expect(wrapRec?.value).toBe('abcdef0123456789');
    expect(saltRec?.value).toBe('1122334455667788');

    mockEnroll.mockRestore();
  });

  it('removes passkey records on removePasskeyUnlock', async () => {
    await db.settings.put({ key: 'passkey_credential_id', value: 'mockCred' });
    await db.settings.put({ key: 'passkey_wrapped_key', value: 'mockWrap' });
    await db.settings.put({ key: 'passkey_prf_salt', value: 'mockSalt' });

    useCardStore.setState({ isPasskeyEnrolled: true });

    await useCardStore.getState().removePasskeyUnlock();

    expect(useCardStore.getState().isPasskeyEnrolled).toBe(false);
    expect(await db.settings.get('passkey_credential_id')).toBeUndefined();
    expect(await db.settings.get('passkey_wrapped_key')).toBeUndefined();
    expect(await db.settings.get('passkey_prf_salt')).toBeUndefined();
  });

  it('purges passkey records on clearPassphrase', async () => {
    await useCardStore.getState().setupPassphrase('test-passphrase-123');
    await db.settings.put({ key: 'passkey_credential_id', value: 'mockCred' });
    await db.settings.put({ key: 'passkey_wrapped_key', value: 'mockWrap' });
    await db.settings.put({ key: 'passkey_prf_salt', value: 'mockSalt' });

    useCardStore.setState({ isPasskeyEnrolled: true });

    await useCardStore.getState().clearPassphrase();

    expect(useCardStore.getState().isPassphraseSet).toBe(false);
    expect(useCardStore.getState().isPasskeyEnrolled).toBe(false);
    expect(await db.settings.get('passkey_credential_id')).toBeUndefined();
    expect(await db.settings.get('passkey_wrapped_key')).toBeUndefined();
    expect(await db.settings.get('passkey_prf_salt')).toBeUndefined();
  });
  it('unlocks the session through a passphrase prompt when there are no connection profiles', async () => {
    await useCardStore.getState().setupPassphrase('test-passphrase-123');
    useCardStore.getState().lockSession();
    expect(await db.connectionProfiles.toArray()).toHaveLength(0);

    const unlockPromise = useCardStore.getState().requestSessionUnlock();
    const request = useCardStore.getState().decryptionRequest;
    expect(request).not.toBeNull();
    request!.resolve('test-passphrase-123');

    await expect(unlockPromise).resolves.toBe(true);
    expect(useCardStore.getState().isUnlocked).toBe(true);
    expect(useCardStore.getState().cryptoKey).not.toBeNull();
    expect(await db.connectionProfiles.toArray()).toHaveLength(0);
  });

  it('creates a passkey-first vault, requires recovery confirmation, and restores the key with recovery code', async () => {
    const mockEnroll = vi.spyOn(passkeyCrypto, 'enrollPasskey').mockResolvedValue({
      credentialIdB64: 'passkey-vault-credential',
      wrappedKeyHex: '00112233445566778899aabbccddeeff',
      prfSaltHex: '11223344556677889900aabbccddeeff',
    });

    try {
      const recoveryCode = await useCardStore.getState().setupPasskeyProtection();
      expect(recoveryCode).toMatch(/^[A-F0-9]{4}(-[A-F0-9]{4}){15}$/);
      expect(useCardStore.getState().isPasskeyOnly).toBe(true);
      expect(useCardStore.getState().isPassphraseSet).toBe(true);
      expect(useCardStore.getState().isUnlocked).toBe(true);
      expect(useCardStore.getState().hasRecoveryKey).toBe(false);
      expect(useCardStore.getState().pendingRecoveryCode).toBe(recoveryCode);
      expect((await db.settings.get('crypto_mode'))?.value).toBe('passkey-only-v1');
      expect((await db.settings.get('crypto_recovery_confirmed'))?.value).toBe(false);

      await useCardStore.getState().confirmRecoveryKeySaved();
      expect(useCardStore.getState().hasRecoveryKey).toBe(true);
      expect(useCardStore.getState().pendingRecoveryCode).toBeNull();
      expect((await db.settings.get('crypto_recovery_confirmed'))?.value).toBe(true);

      const currentKey = useCardStore.getState().cryptoKey!;
      const encryptedFixture = await encryptText('test-api-key-value', currentKey);
      expect(encryptedFixture.startsWith('enc.v1.')).toBe(true);

      useCardStore.getState().lockSession();
      expect(await useCardStore.getState().unlockWithRecoveryCode('0000-0000')).toBe(false);
      expect(await useCardStore.getState().unlockWithRecoveryCode(recoveryCode!)).toBe(true);
      const recoveredKey = useCardStore.getState().cryptoKey!;
      await expect(decryptText(encryptedFixture, recoveredKey)).resolves.toBe('test-api-key-value');
    } finally {
      mockEnroll.mockRestore();
    }
  });

  it('encrypts a new profile using passkey-only setup after recovery confirmation', async () => {
    const mockEnroll = vi.spyOn(passkeyCrypto, 'enrollPasskey').mockResolvedValue({
      credentialIdB64: 'profile-vault-credential',
      wrappedKeyHex: '00112233445566778899aabbccddeeff',
      prfSaltHex: '11223344556677889900aabbccddeeff',
    });

    try {
      const savePromise = useCardStore.getState().saveProfile({
        uuid: 'passkey-only-profile',
        name: 'Passkey-only profile',
        provider: 'openai',
        model: 'gpt-test',
        apiKey: 'plaintext-test-key',
        isDefault: true,
      });
      const waitingRequest = useCardStore.getState().passphraseSetupRequest;
      expect(waitingRequest).not.toBeNull();

      const recoveryCode = await useCardStore.getState().setupPasskeyProtection();
      expect(recoveryCode).not.toBeNull();
      await useCardStore.getState().confirmRecoveryKeySaved();
      waitingRequest!.resolve('__ROLEPLAY_FORGE_PASSKEY_ONLY_SETUP__');
      useCardStore.setState({ passphraseSetupRequest: null, passphraseSetupError: null });

      await savePromise;
      const stored = await db.connectionProfiles.where('uuid').equals('passkey-only-profile').first();
      expect(stored?.apiKey?.startsWith('enc.v1.')).toBe(true);
      expect(await useCardStore.getState().getDecryptedApiKey(stored!, false)).toBe('plaintext-test-key');
    } finally {
      mockEnroll.mockRestore();
    }
  });

});
