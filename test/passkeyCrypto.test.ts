// @vitest-environment jsdom
import '../test/setup';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isPasskeySupported,
  enrollPasskey,
  unlockWithPasskey,
  buf2b64,
  b642buf,
  buf2hex,
  hex2buf,
} from '../src/utils/passkeyCrypto';

describe('passkeyCrypto Utilities', () => {
  beforeEach(() => {
    // Define mock PublicKeyCredential on window
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: function () {},
      writable: true,
      configurable: true,
    });

    const mockCredentials = {
      create: vi.fn(),
      get: vi.fn(),
    };

    Object.defineProperty(navigator, 'credentials', {
      value: mockCredentials,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Buffer Encoding Helpers', () => {
    it('round-trips Base64 conversions', () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 255, 128, 64, 0]);
      const b64 = buf2b64(bytes);
      const recovered = b642buf(b64);
      expect(Array.from(recovered)).toEqual(Array.from(bytes));
    });

    it('round-trips Hex conversions', () => {
      const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x01, 0x02]);
      const hex = buf2hex(bytes);
      expect(hex).toBe('deadbeef0102');
      const recovered = hex2buf(hex);
      expect(Array.from(recovered)).toEqual(Array.from(bytes));
    });

    it('handles malformed hex safely', () => {
      expect(hex2buf('').length).toBe(0);
      expect(hex2buf('invalid').length).toBe(0);
    });
  });

  describe('isPasskeySupported', () => {
    it('returns true when PublicKeyCredential and credentials API are present', () => {
      expect(isPasskeySupported()).toBe(true);
    });

    it('returns false when PublicKeyCredential is not defined', () => {
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(isPasskeySupported()).toBe(false);
    });

    it('returns false when navigator.credentials is missing', () => {
      Object.defineProperty(navigator, 'credentials', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(isPasskeySupported()).toBe(false);
    });
  });

  describe('enrollPasskey', () => {
    it('returns null if PRF extension is not supported / prf.enabled is falsy', async () => {
      const createMock = vi.fn().mockResolvedValue({
        rawId: new Uint8Array([10, 20, 30, 40]).buffer,
        getClientExtensionResults: () => ({
          prf: { enabled: false },
        }),
      });
      navigator.credentials.create = createMock;

      const masterKeyBytes = new Uint8Array(32).fill(7);
      const result = await enrollPasskey(masterKeyBytes);

      expect(result).toBeNull();
      expect(createMock).toHaveBeenCalledTimes(1);
    });

    it('returns null if credential creation is cancelled or returns null', async () => {
      navigator.credentials.create = vi.fn().mockResolvedValue(null);
      const masterKeyBytes = new Uint8Array(32).fill(7);
      const result = await enrollPasskey(masterKeyBytes);
      expect(result).toBeNull();
    });

    it('returns null if post-create credentials.get fails to yield PRF output', async () => {
      const mockRawId = new Uint8Array([1, 2, 3, 4]).buffer;
      navigator.credentials.create = vi.fn().mockResolvedValue({
        rawId: mockRawId,
        getClientExtensionResults: () => ({
          prf: { enabled: true },
        }),
      });

      navigator.credentials.get = vi.fn().mockResolvedValue({
        getClientExtensionResults: () => ({
          prf: {}, // Missing results.first
        }),
      });

      const masterKeyBytes = new Uint8Array(32).fill(7);
      const result = await enrollPasskey(masterKeyBytes);
      expect(result).toBeNull();
    });
  });

  describe('Enrollment and Unlock Round-Trip', () => {
    it('enrolls passkey and recovers raw master key bytes on unlock', async () => {
      const mockCredId = new Uint8Array([42, 43, 44, 45, 46]);
      // Fixed 32-byte pseudo-PRF output
      const mockPrfOutput = new Uint8Array(32).fill(0x5a);

      navigator.credentials.create = vi.fn().mockResolvedValue({
        rawId: mockCredId.buffer,
        getClientExtensionResults: () => ({
          prf: { enabled: true },
        }),
      });

      navigator.credentials.get = vi.fn().mockResolvedValue({
        rawId: mockCredId.buffer,
        getClientExtensionResults: () => ({
          prf: {
            results: {
              first: mockPrfOutput.buffer,
            },
          },
        }),
      });

      const rawMasterKey = crypto.getRandomValues(new Uint8Array(32));

      // 1. Enroll
      const enrollment = await enrollPasskey(rawMasterKey);
      expect(enrollment).not.toBeNull();
      expect(enrollment?.credentialIdB64).toBe(buf2b64(mockCredId));
      expect(typeof enrollment?.wrappedKeyHex).toBe('string');
      expect(typeof enrollment?.prfSaltHex).toBe('string');

      // 2. Unlock with enrolled data
      const recoveredBytes = await unlockWithPasskey(
        enrollment!.credentialIdB64,
        enrollment!.prfSaltHex,
        enrollment!.wrappedKeyHex
      );

      expect(recoveredBytes).not.toBeNull();
      expect(Array.from(recoveredBytes!)).toEqual(Array.from(rawMasterKey));
    });

    it('returns null on unlock if user cancels without throwing', async () => {
      navigator.credentials.get = vi.fn().mockRejectedValue(new Error('User cancelled'));

      const result = await unlockWithPasskey(
        'dGVzdA==',
        '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
        '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233'
      );

      expect(result).toBeNull();
    });

    it('returns null on malformed or truncated wrapped key without throwing', async () => {
      const result = await unlockWithPasskey(
        'dGVzdA==',
        '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
        'short'
      );

      expect(result).toBeNull();
    });
  });
});
