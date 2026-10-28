// @vitest-environment jsdom
import '../test/setup';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../src/db';
import { useCardStore } from '../src/store/useCardStore';
import * as passkeyCrypto from '../src/utils/passkeyCrypto';

describe('sessionSlice - Passkey Integration', () => {
  beforeEach(async () => {
    await db.settings.clear();
    await db.connectionProfiles.clear();
    useCardStore.setState({
      isPassphraseSet: false,
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

});
