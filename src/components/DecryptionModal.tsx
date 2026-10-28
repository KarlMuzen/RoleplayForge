import React, { useState } from 'react';
import { useCardStore } from '../store/useCardStore';
import { useModalA11y } from '../hooks/useModalA11y';
import { Lock, Eye, EyeOff, X, Loader2, Fingerprint, KeyRound } from 'lucide-react';

export const DecryptionModal: React.FC = () => {
  const {
    decryptionRequest,
    decryptionError,
    isPasskeyEnrolled,
    isPasskeySupported,
    isPasskeyOnly,
    hasRecoveryKey,
    unlockWithPasskeyAction,
    unlockWithRecoveryCode,
  } = useCardStore();
  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPasskeyProcessing, setIsPasskeyProcessing] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(isPasskeyOnly && !isPasskeySupported);
  const [localError, setLocalError] = useState<string | null>(null);

  const [prevRequest, setPrevRequest] = useState(decryptionRequest);
  if (decryptionRequest !== prevRequest) {
    setPrevRequest(decryptionRequest);
    setPassphrase('');
    setIsProcessing(false);
    setIsPasskeyProcessing(false);
    setIsRecoveryMode(isPasskeyOnly && !isPasskeySupported);
    setLocalError(null);
  }

  const [prevError, setPrevError] = useState(decryptionError);
  if (decryptionError !== prevError) {
    setPrevError(decryptionError);
    setIsProcessing(false);
  }

  const isVisible = !!decryptionRequest;

  const handleCancel = () => {
    if (isProcessing || isPasskeyProcessing) return;
    decryptionRequest?.resolve(null);
    useCardStore.setState({ decryptionRequest: null, decryptionError: null });
  };

  const finishUnlock = () => {
    decryptionRequest?.resolve('');
    useCardStore.setState({ decryptionRequest: null, decryptionError: null });
    setLocalError(null);
  };

  const handlePasskeyUnlock = async () => {
    if (isProcessing || isPasskeyProcessing) return;
    setLocalError(null);
    setIsPasskeyProcessing(true);
    try {
      const ok = await unlockWithPasskeyAction();
      if (ok) {
        finishUnlock();
      } else {
        setLocalError('Passkey unlock did not complete. Try again or use your recovery key.');
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Passkey unlock failed.');
    } finally {
      setIsPasskeyProcessing(false);
    }
  };

  const modalRef = useModalA11y(isVisible, handleCancel);
  if (!isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase || isProcessing || isPasskeyProcessing) return;
    setLocalError(null);
    setIsProcessing(true);

    setTimeout(async () => {
      if (isPasskeyOnly && isRecoveryMode) {
        const ok = await unlockWithRecoveryCode(passphrase);
        if (ok) {
          finishUnlock();
        } else {
          setLocalError('Recovery key was not accepted. Check the characters and try again.');
        }
        setIsProcessing(false);
        return;
      }

      decryptionRequest?.resolve(passphrase);
    }, 50);
  };

  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const showRecoveryInput = isPasskeyOnly && isRecoveryMode;
  const showPassphraseInput = !isPasskeyOnly;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Unlock API key vault"
      tabIndex={-1}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="absolute inset-0 bg-void-950/80 backdrop-blur-sm" onClick={handleCancel} />

      <div className="relative bg-void-900 border border-knight-700/50 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl">
        <button
          onClick={handleCancel}
          disabled={isProcessing || isPasskeyProcessing}
          aria-label="Close dialog"
          className="absolute top-3.5 right-3.5 text-knight-400 hover:text-mist-200 p-2 min-w-11 min-h-11 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-fast"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-10 h-10 rounded-xl bg-maroon-500/20 text-maroon-400 flex items-center justify-center border border-maroon-500/30">
            {isPasskeyOnly ? <Fingerprint className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-mist-100">{isPasskeyOnly ? 'Unlock API key vault' : 'Unlock API keys'}</h2>
            <p className="text-xs text-knight-400">
              {isPasskeyOnly ? 'Authenticate to decrypt keys saved on this device' : 'Unlock your encrypted API keys for this session'}
            </p>
          </div>
        </div>

        {isPasskeyEnrolled && isPasskeySupported && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handlePasskeyUnlock}
              disabled={isProcessing || isPasskeyProcessing}
              className="w-full min-h-12 flex items-center justify-center gap-2.5 py-3 px-4 bg-void-950 hover:bg-void-850 text-mist-100 hover:text-white border border-knight-700/80 hover:border-maroon-500/60 rounded-xl text-sm font-semibold shadow-sm transition-all touch-fast disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPasskeyProcessing ? <Loader2 className="w-4 h-4 animate-spin text-maroon-400" /> : <Fingerprint className="w-4 h-4 text-maroon-400" />}
              <span>{isPasskeyProcessing ? 'Verifying passkey…' : 'Unlock with passkey'}</span>
            </button>
            {!isPasskeyOnly && (
              <div className="flex items-center gap-3 my-3">
                <div className="h-px bg-knight-800 flex-1" />
                <span className="text-xs text-knight-400">Or enter passphrase</span>
                <div className="h-px bg-knight-800 flex-1" />
              </div>
            )}
          </div>
        )}

        {isPasskeyOnly && !isRecoveryMode && hasRecoveryKey && (
          <button
            type="button"
            onClick={() => { setIsRecoveryMode(true); setPassphrase(''); setLocalError(null); }}
            className="w-full min-h-11 flex items-center justify-center gap-2 rounded-xl border border-knight-700 bg-void-800 px-4 py-2.5 text-sm font-medium text-mist-100 hover:bg-void-700 touch-fast"
          >
            <KeyRound className="w-4 h-4 text-maroon-400" />
            Use recovery key instead
          </button>
        )}

        {isPasskeyOnly && !hasRecoveryKey && (
          <p className="mb-4 rounded-xl border border-amber-800/50 bg-amber-950/30 p-3 text-xs leading-relaxed text-amber-200">
            A recovery key has not been confirmed yet. Unlock with your passkey, then create and save a recovery key in Security settings.
          </p>
        )}

        {showRecoveryInput && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => { setIsRecoveryMode(false); setPassphrase(''); setLocalError(null); }}
              className="mb-3 min-h-10 text-sm text-knight-300 underline underline-offset-4 hover:text-mist-100 touch-fast"
            >
              Back to passkey unlock
            </button>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label htmlFor="vault-recovery-key" className="block text-xs font-medium text-knight-300">Recovery key</label>
              <input
                id="vault-recovery-key"
                type="text"
                value={passphrase}
                onChange={(e) => { setPassphrase(e.target.value); setLocalError(null); }}
                placeholder="XXXX-XXXX-…"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                disabled={isProcessing || isPasskeyProcessing}
                autoFocus={!isTouchDevice}
                className="w-full min-h-12 bg-void-950 border border-knight-700/60 rounded-xl px-4 py-3 font-mono text-sm tracking-wider text-mist-200 focus:outline-none focus:border-maroon-500/50 focus:ring-1 focus:ring-maroon-500/50 disabled:opacity-50"
              />
              {(localError || decryptionError) && <p role="alert" className="text-xs text-red-300">{localError || decryptionError}</p>}
              <button type="submit" disabled={!passphrase.trim() || isProcessing || isPasskeyProcessing} className="w-full min-h-11 rounded-xl bg-maroon-600 hover:bg-maroon-500 disabled:opacity-50 px-4 py-3 text-sm font-semibold text-white touch-fast">
                {isProcessing ? 'Checking recovery key…' : 'Recover vault'}
              </button>
            </form>
          </div>
        )}

        {showPassphraseInput && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => { setPassphrase(e.target.value); setLocalError(null); }}
                  placeholder="Master passphrase"
                  disabled={isProcessing || isPasskeyProcessing}
                  className="w-full min-h-11 bg-void-950 border border-knight-700/60 rounded-xl px-4 py-3 text-sm text-mist-200 focus:outline-none focus:border-maroon-500/50 focus:ring-1 focus:ring-maroon-500/50 transition-all pr-12 disabled:opacity-50"
                  autoFocus={!isTouchDevice && !(isPasskeyEnrolled && isPasskeySupported)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isProcessing || isPasskeyProcessing}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-knight-400 hover:text-mist-200 p-2 min-w-10 min-h-10 flex items-center justify-center rounded-lg disabled:opacity-50 touch-fast"
                  aria-label={showPassword ? 'Hide passphrase' : 'Show passphrase'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {(localError || decryptionError) && <p role="alert" className="text-xs text-red-300 mt-2">{localError || decryptionError}</p>}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isProcessing || isPasskeyProcessing}
                className="min-h-11 px-4 py-2 rounded-xl text-sm font-medium text-knight-300 hover:text-mist-200 hover:bg-void-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!passphrase || isProcessing || isPasskeyProcessing}
                className="min-h-11 px-5 py-2 rounded-xl text-sm font-medium bg-maroon-500 hover:bg-maroon-400 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
              >
                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Unlocking…</> : 'Unlock'}
              </button>
            </div>
          </form>
        )}

        {isPasskeyOnly && !isRecoveryMode && localError && <p role="alert" className="mt-3 text-xs text-red-300">{localError}</p>}
      </div>
    </div>
  );
};
