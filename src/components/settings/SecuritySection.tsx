import React, { useState } from 'react';
import type { ConnectionProfile } from '../../db';
import { useCardStore } from '../../store/useCardStore';
import { useDialogStore } from '../../store/useDialogStore';
import { useToastStore } from '../../store/useToastStore';
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
                    isPasskeyOnly
                      ? 'Resetting this passkey vault permanently removes all saved API keys from this device. You will need to re-enter them after setting up protection again. Proceed?'
                      : 'Removing your Master Passphrase will purge all stored API keys from IndexedDB for your security. Proceed?',
                    isPasskeyOnly ? 'Reset API key vault' : 'Remove Master Passphrase',
                    { confirmText: isPasskeyOnly ? 'Reset & Purge Keys' : 'Remove & Purge Keys', variant: 'danger' }
                  );
                  if (confirmed) {
                    await clearPassphrase();
                    useDialogStore.getState().showAlert('API key protection removed and saved API keys purged from this device.', 'Protection Reset', 'info');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-void-800 hover:bg-red-950/60 text-red-300 border border-knight-700 hover:border-red-800 rounded-xl text-xs font-medium transition-all"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {isPasskeyOnly ? 'Reset vault & purge keys' : 'Remove Passphrase'}
              </button>
            </div>
          </div>

          {isPasskeyOnly && isUnlocked && (
            <div className={`rounded-xl border p-3 space-y-2 ${hasRecoveryKey ? 'border-knight-800 bg-void-950/70' : 'border-amber-800/50 bg-amber-950/25'}`}>
              <p className={`text-xs leading-relaxed ${hasRecoveryKey ? 'text-knight-300' : 'text-amber-200'}`}>
                {hasRecoveryKey
                  ? 'A recovery key is configured. Keep your offline copy current. Replacing it invalidates the old key as soon as you generate a new one.'
                  : 'Your passkey vault does not have a confirmed recovery key. Create and save one now so you can recover if passkey access is lost.'}
              </p>
              <button
                onClick={async () => {
                  if (hasRecoveryKey) {
                    const confirmed = await useDialogStore.getState().showConfirm(
                      'A new recovery key will immediately invalidate the old one. Continue only if you can save the new key somewhere separate from this device.',
                      'Replace Recovery Key',
                      { confirmText: 'Generate New Key', variant: 'danger' }
                    );
                    if (!confirmed) return;
                  }
                  try {
                    const code = await useCardStore.getState().setupRecoveryKey();
                    if (!code) throw new Error('Unlock the vault first, then try again.');
                  } catch (err) {
                    useToastStore.getState().showToast({
                      title: hasRecoveryKey ? 'Could not replace recovery key' : 'Could not create recovery key',
                      message: err instanceof Error ? err.message : 'Recovery-key creation failed.',
                      type: 'error',
                    });
                  }
                }}
                className={`min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-white touch-fast ${hasRecoveryKey ? 'bg-void-800 hover:bg-void-700 border border-knight-700' : 'bg-amber-700 hover:bg-amber-600'}`}
              >
                {hasRecoveryKey ? 'Replace recovery key' : 'Create recovery key'}
              </button>
            </div>
          )}

          {/* Optional passkey unlock for passphrase-protected vaults */}
          {isPasskeySupported && isUnlocked && !isPasskeyOnly && (
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
            {isPasskeySupported
              ? 'Use your device passkey to protect saved API keys. A one-time recovery key will be shown during setup; save it somewhere separate from this device.'
              : 'Use a master passphrase to encrypt saved API keys on this device. Card and lorebook content is not encrypted by this setting.'}
          </p>

          <button
            onClick={() => {
              useCardStore.setState({
                passphraseSetupRequest: {
                  resolve: async (choice) => {
                    if (choice?.kind === 'passphrase') {
                      await setupPassphrase(choice.passphrase);
                    }
                  },
                },
              });
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-maroon-600 to-maroon-800 hover:from-maroon-500 hover:to-maroon-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            {isPasskeySupported ? <Fingerprint className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            {isPasskeySupported ? 'Set up API key protection' : 'Set up master passphrase'}
          </button>
        </div>
      )}
    </div>
  );
};
