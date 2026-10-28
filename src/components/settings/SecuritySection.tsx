import React, { useState } from 'react';
import type { ConnectionProfile } from '../../db';
import { useCardStore } from '../../store/useCardStore';
import { useDialogStore } from '../../store/useDialogStore';
import { useToastStore } from '../../store/useToastStore';
import { PASSKEY_ONLY_SETUP_SENTINEL } from '../../utils/passkeyCrypto';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Fingerprint,
} from 'lucide-react';

export interface SecuritySectionProps {
  isPassphraseSet: boolean;
  isUnlocked: boolean;
  lockSession: () => void;
  clearPassphrase: () => Promise<void>;
  setupPassphrase: (pass: string) => Promise<void>;
  isPasskeySupported: boolean;
  isPasskeyEnrolled: boolean;
  enrollPasskeyUnlock: () => Promise<boolean>;
  removePasskeyUnlock: () => Promise<void>;
  profiles: ConnectionProfile[];
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  isPassphraseSet,
  isUnlocked,
  lockSession,
  clearPassphrase,
  setupPassphrase,
  isPasskeySupported,
  isPasskeyEnrolled,
  enrollPasskeyUnlock,
  removePasskeyUnlock,
  profiles,
}) => {
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const isPasskeyOnly = useCardStore((state) => state.isPasskeyOnly);
  const hasRecoveryKey = useCardStore((state) => state.hasRecoveryKey);

  return (
    <div className="bg-void-900 border border-knight-700/40 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-knight-700/40 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-mist-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-maroon-400" />
            API key protection
          </h3>
          <p className="text-xs text-knight-400">
            Client-side AES-256-GCM encryption for API keys stored in IndexedDB
          </p>
        </div>

        {isPassphraseSet ? (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 rounded-xl text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            {isPasskeyOnly ? 'Passkey protection active' : 'Master Passphrase Active'}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-void-800 border border-knight-700 text-knight-300 rounded-xl text-xs font-medium">
            Not set up
          </span>
        )}
      </div>

      {isPassphraseSet ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-void-950/80 rounded-xl border border-knight-800">
            <div className="space-y-1">
              <div className="text-xs font-medium text-mist-100 flex items-center gap-2">
                <span>Session Status:</span>
                {isUnlocked ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Unlock className="w-3.5 h-3.5" /> Unlocked (Active Memory Session)
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Session Locked
                  </span>
                )}
              </div>
              <p className="text-[11px] text-knight-400">
                {isPasskeyOnly
                  ? 'API keys are encrypted on this device with a random vault key protected by your passkey. Decrypted keys exist only in the active session.'
                  : 'API keys are encrypted with AES-GCM using a key derived by PBKDF2 (600,000 rounds of SHA-256). Decrypted keys exist only in the active session.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isUnlocked ? (
                <button
                  onClick={() => {
                    lockSession();
                    useDialogStore.getState().showAlert('Session locked. API keys purged from active memory.', 'Session Locked', 'info');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-void-800 hover:bg-knight-700 text-mist-100 border border-knight-700 rounded-xl text-xs font-medium transition-all"
                >
                  <Lock className="w-3.5 h-3.5 text-maroon-400" />
                  Lock Session
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const unlocked = await useCardStore.getState().requestSessionUnlock();
                      if (unlocked) {
                        useToastStore.getState().showToast({
                          title: 'Session unlocked',
                          message: profiles.length === 0
                            ? 'You can now add a connection profile and save encrypted API keys.'
                            : 'Encrypted API keys can now be used in this session.',
                          type: 'success',
                        });
                      } else {
                        useToastStore.getState().showToast({
                          title: 'Session remains locked',
                          message: 'Unlock was cancelled or the passphrase could not be verified.',
                          type: 'warning',
                        });
                      }
                    } catch (err) {
                      useToastStore.getState().showToast({
                        title: 'Could not unlock session',
                        message: err instanceof Error ? err.message : 'Unlock failed.',
                        type: 'error',
                      });
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-maroon-600 hover:bg-maroon-500 text-white rounded-xl text-xs font-medium transition-all"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Unlock Session
                </button>
              )}

              <button
                onClick={async () => {
                  const confirmed = await useDialogStore.getState().showConfirm(
                    'Removing your Master Passphrase will purge all stored API keys from IndexedDB for your security. Proceed?',
                    'Remove Master Passphrase',
                    { confirmText: 'Remove & Purge Keys', variant: 'danger' }
                  );
                  if (confirmed) {
                    await clearPassphrase();
                    useDialogStore.getState().showAlert('Master Passphrase removed and all stored API keys purged from disk.', 'Passphrase Removed', 'info');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-void-800 hover:bg-red-950/60 text-red-300 border border-knight-700 hover:border-red-800 rounded-xl text-xs font-medium transition-all"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Remove Passphrase
              </button>
            </div>
          </div>

          {/* Optional Passkey (WebAuthn PRF) Fast Unlock */}
          {isPasskeySupported && isUnlocked && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-void-950/80 rounded-xl border border-knight-800">
              <div className="space-y-1">
                <div className="text-xs font-medium text-mist-100 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-maroon-400" />
                  <span>Passkey Unlock (Biometrics / Security Key):</span>
                  {isPasskeyEnrolled ? (
                    <span className="text-emerald-400 font-semibold text-[10px] bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      Enrolled
                    </span>
                  ) : (
                    <span className="text-knight-400 font-normal text-[10px] bg-void-800 border border-knight-700 px-2 py-0.5 rounded-full">
                      Not Enrolled
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-knight-400">
                  Fast unlock alternative using WebAuthn PRF. The master passphrase remains the sole root of trust.
                </p>
              </div>

              <div>
                {isPasskeyEnrolled ? (
                  <button
                    onClick={async () => {
                      const confirmed = await useDialogStore.getState().showConfirm(
                        'Remove passkey unlock for this device? You can re-enroll at any time while the session is unlocked.',
                        'Remove Passkey',
                        { confirmText: 'Remove Passkey', variant: 'danger' }
                      );
                      if (confirmed) {
                        await removePasskeyUnlock();
                        useToastStore.getState().showToast({
                          title: 'Passkey Removed',
                          message: 'Passkey unlock removed from this device.',
                          type: 'info',
                        });
                      }
                    }}
                    disabled={isPasskeyLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-void-800 hover:bg-red-950/60 text-red-300 border border-knight-700 hover:border-red-800 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    Remove Passkey
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      setIsPasskeyLoading(true);
                      try {
                        const success = await enrollPasskeyUnlock();
                        if (success) {
                          useToastStore.getState().showToast({
                            title: 'Passkey Enrolled',
                            message: 'Passkey unlock enabled. You can now use biometrics or security keys to unlock API keys.',
                            type: 'success',
                          });
                        } else {
                          useToastStore.getState().showToast({
                            title: 'Enrollment Failed',
                            message: 'Passkey enrollment was cancelled or your device does not support WebAuthn PRF.',
                            type: 'warning',
                          });
                        }
                      } finally {
                        setIsPasskeyLoading(false);
                      }
                    }}
                    disabled={isPasskeyLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-maroon-600 to-maroon-800 hover:from-maroon-500 hover:to-maroon-700 text-white rounded-xl text-xs font-medium shadow-sm transition-all disabled:opacity-50"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    {isPasskeyLoading ? 'Enrolling...' : 'Enroll Passkey'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 bg-void-950/80 p-4 rounded-xl border border-knight-800">
          <p className="text-xs text-knight-300 leading-relaxed">
            A passphrase is needed to save API keys. Roleplay Forge encrypts saved keys on this device with <strong>AES-256-GCM</strong>, using a key derived with <strong>PBKDF2 (600,000 iterations)</strong>, before storing them in IndexedDB. Card and lorebook content is not encrypted by this passphrase. A working, previously enrolled passkey can still unlock saved keys if you forget the passphrase; without one, there is no passphrase reset and saved keys may be unrecoverable.
          </p>

          <button
            onClick={() => {
              useCardStore.setState({
                passphraseSetupRequest: {
                  resolve: async (pass) => {
                    if (pass) {
                      await setupPassphrase(pass);
                    }
                  },
                },
              });
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-maroon-600 to-maroon-800 hover:from-maroon-500 hover:to-maroon-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            Establish Master Passphrase Now
          </button>
        </div>
      )}
    </div>
  );
};
