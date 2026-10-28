import React, { useState } from 'react';
import { useCardStore } from '../store/useCardStore';
import { useModalA11y } from '../hooks/useModalA11y';
import { ShieldCheck, Eye, EyeOff, X, KeyRound, Loader2, Fingerprint, Copy, CheckCircle2 } from 'lucide-react';
import { PASSKEY_ONLY_SETUP_SENTINEL } from '../utils/passkeyCrypto';

export const PassphraseSetupModal: React.FC = () => {
  const {
    passphraseSetupRequest,
    passphraseSetupError,
    isPasskeySupported,
    pendingRecoveryCode,
  } = useCardStore();
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassphraseForm, setShowPassphraseForm] = useState(!isPasskeySupported);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPasskeyProcessing, setIsPasskeyProcessing] = useState(false);
  const [hasSavedRecovery, setHasSavedRecovery] = useState(false);
  const [isRecoveryCopied, setIsRecoveryCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [prevRequest, setPrevRequest] = useState(passphraseSetupRequest);
  if (passphraseSetupRequest !== prevRequest) {
    setPrevRequest(passphraseSetupRequest);
    setPassphrase('');
    setConfirmPassphrase('');
    setIsProcessing(false);
    setIsPasskeyProcessing(false);
    setHasSavedRecovery(false);
    setIsRecoveryCopied(false);
    setLocalError(null);
    setShowPassphraseForm(!isPasskeySupported);
  }

  const isVisible = !!passphraseSetupRequest || !!pendingRecoveryCode;

  const handleCancel = () => {
    if (isProcessing || isPasskeyProcessing || pendingRecoveryCode) return;
    passphraseSetupRequest?.resolve(null);
    useCardStore.setState({ passphraseSetupRequest: null, passphraseSetupError: null });
  };

  const modalRef = useModalA11y(isVisible, handleCancel);
  if (!isVisible) return null;

  const handlePasskeySetup = async () => {
    if (isPasskeyProcessing || isProcessing) return;
    setLocalError(null);
    setIsPasskeyProcessing(true);
    try {
      const recoveryCode = await useCardStore.getState().setupPasskeyProtection();
      if (!recoveryCode) {
        setLocalError('Passkey setup was cancelled or this authenticator does not support the required PRF extension. You can use a master passphrase instead.');
      } else {
        setHasSavedRecovery(false);
        setIsRecoveryCopied(false);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Passkey setup failed. Please use the passphrase option or try again.');
    } finally {
      setIsPasskeyProcessing(false);
    }
  };

  const handleCopyRecoveryCode = async () => {
    if (!pendingRecoveryCode) return;
    try {
      await navigator.clipboard.writeText(pendingRecoveryCode);
      setIsRecoveryCopied(true);
      setLocalError(null);
    } catch {
      setLocalError('Clipboard access is unavailable. Select the recovery key and copy it manually.');
    }
  };

  const handleConfirmRecoverySaved = async () => {
    if (!pendingRecoveryCode || !hasSavedRecovery) return;
    const current = useCardStore.getState();
    const waitingRequest = current.passphraseSetupRequest;
    try {
      await current.confirmRecoveryKeySaved();
      waitingRequest?.resolve(PASSKEY_ONLY_SETUP_SENTINEL);
      useCardStore.setState({ passphraseSetupRequest: null, passphraseSetupError: null });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not save recovery-key confirmation. Keep this screen open and retry.');
    }
  };

  const getStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    if (pass.length < 8) return { score: 1, label: 'Weak', color: 'bg-red-500 text-red-400' };
    if (pass.length < 10) return { score: 2, label: 'Moderate', color: 'bg-amber-500 text-amber-400' };
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) {
      return { score: 3, label: 'Strong', color: 'bg-emerald-500 text-emerald-400' };
    }
    return { score: 2, label: 'Good', color: 'bg-emerald-500 text-emerald-400' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!passphrase) return setLocalError('Please enter a passphrase.');
    if (passphrase.length < 8) return setLocalError('Passphrase must be at least 8 characters long.');
    const strength = getStrength(passphrase);
    if (strength.label === 'Weak') return setLocalError('Passphrase strength must be at least Moderate.');
    if (passphrase !== confirmPassphrase) return setLocalError('Passphrases do not match.');

    setIsProcessing(true);
    setTimeout(() => passphraseSetupRequest?.resolve(passphrase), 50);
  };

  const strength = getStrength(passphrase);
  const displayError = localError || passphraseSetupError;
  const recoveryPending = !!pendingRecoveryCode;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={recoveryPending ? 'Save vault recovery key' : 'Set up API key protection'}
      tabIndex={-1}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="absolute inset-0 bg-void-950/80 backdrop-blur-sm" onClick={handleCancel} />

      <div className="relative bg-void-900 border border-knight-700/50 rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain shadow-2xl">
        <button
          onClick={handleCancel}
          disabled={isProcessing || isPasskeyProcessing || recoveryPending}
          aria-label="Close dialog"
          className="absolute top-3 right-3 z-10 min-w-11 min-h-11 flex items-center justify-center text-knight-400 hover:text-mist-200 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-fast"
        >
          <X className="w-5 h-5" />
        </button>

        {recoveryPending ? (
          <div className="space-y-4 pr-1">
            <div className="flex items-center gap-3 pr-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-mist-100">Save your recovery key</h2>
                <p className="text-xs text-knight-400">Required before the vault setup finishes</p>
              </div>
            </div>
            <p className="text-sm text-knight-300 leading-relaxed">
              Store this key somewhere separate from this device, such as a password manager or a secure offline note. It can recover your encrypted API keys if you lose access to the passkey. It will not be shown again after you leave this screen.
            </p>
            <div className="select-all break-all rounded-xl border border-knight-700 bg-void-950 p-4 text-center font-mono text-base sm:text-lg tracking-wider text-emerald-200">
              {pendingRecoveryCode}
            </div>
            <button
              type="button"
              onClick={handleCopyRecoveryCode}
              className="w-full min-h-11 flex items-center justify-center gap-2 rounded-xl border border-knight-700 bg-void-800 px-4 py-2.5 text-sm font-medium text-mist-100 hover:bg-void-700 touch-fast"
            >
              {isRecoveryCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {isRecoveryCopied ? 'Recovery key copied' : 'Copy recovery key'}
            </button>
            <label className="flex items-start gap-3 rounded-xl border border-knight-800 bg-void-950/70 p-3 text-sm text-knight-200">
              <input
                type="checkbox"
                checked={hasSavedRecovery}
                onChange={(e) => setHasSavedRecovery(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald-500"
              />
              <span>I have saved this recovery key somewhere safe and can access it without this device.</span>
            </label>
            {localError && <p role="alert" className="text-xs text-red-300 rounded-xl bg-red-950/40 border border-red-800/50 p-3">{localError}</p>}
            <button
              type="button"
              disabled={!hasSavedRecovery}
              onClick={handleConfirmRecoverySaved}
              className="w-full min-h-11 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-3 text-sm font-semibold text-white touch-fast"
            >
              I've saved the recovery key — continue
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4 pr-8">
              <div className="w-10 h-10 rounded-xl bg-maroon-500/20 text-maroon-400 flex items-center justify-center border border-maroon-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-mist-100">Set up API key protection</h2>
                <p className="text-xs text-knight-400">
                  {isPasskeySupported ? 'Use your device passkey first, or choose a master passphrase.' : 'Create a master passphrase to protect saved API keys.'}
                </p>
              </div>
            </div>

            <p className="text-sm text-knight-300 mb-4 leading-relaxed bg-void-950/80 p-3 rounded-xl border border-knight-800/80">
              API keys are encrypted on this device before they are stored in IndexedDB. The rest of your card content is not encrypted by this protection.
            </p>

            {isPasskeySupported && (
              <button
                type="button"
                onClick={handlePasskeySetup}
                disabled={isProcessing || isPasskeyProcessing}
                className="w-full min-h-12 flex items-center justify-center gap-2.5 rounded-xl bg-maroon-600 hover:bg-maroon-500 px-4 py-3 text-sm font-semibold text-white shadow-sm touch-fast disabled:opacity-50"
              >
                {isPasskeyProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                {isPasskeyProcessing ? 'Setting up passkey…' : 'Protect with passkey'}
              </button>
            )}

            {isPasskeySupported && !showPassphraseForm && (
              <button
                type="button"
                onClick={() => setShowPassphraseForm(true)}
                className="mt-3 w-full min-h-11 text-sm font-medium text-knight-300 hover:text-mist-100 underline underline-offset-4 touch-fast"
              >
                Use a master passphrase instead
              </button>
            )}

            {showPassphraseForm && (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                {isPasskeySupported && (
                  <p className="text-xs text-knight-400">Fallback option: you will need this passphrase to unlock your saved API keys on this device.</p>
                )}
                <div>
                  <label className="block text-xs font-medium text-knight-300 mb-1.5">Master passphrase</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter a strong passphrase"
                      disabled={isProcessing || isPasskeyProcessing}
                      className="w-full min-h-11 bg-void-950 border border-knight-700/60 rounded-xl px-4 py-2.5 text-sm text-mist-200 focus:outline-none focus:border-maroon-500/50 focus:ring-1 focus:ring-maroon-500/50 transition-all pr-12 disabled:opacity-50"
                      autoFocus={!isPasskeySupported}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isProcessing || isPasskeyProcessing}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-knight-400 hover:text-mist-200 p-2 min-w-10 min-h-10 flex items-center justify-center rounded-lg touch-fast"
                      aria-label={showPassword ? 'Hide passphrase' : 'Show passphrase'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passphrase && (
                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                      <div className={`h-1.5 w-12 rounded-full ${strength.color}`} />
                      <span className="text-knight-400">Strength: <strong className={strength.color.split(' ')[1]}>{strength.label}</strong></span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-knight-300 mb-1.5">Confirm passphrase</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassphrase}
                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                    placeholder="Confirm passphrase"
                    disabled={isProcessing || isPasskeyProcessing}
                    className="w-full min-h-11 bg-void-950 border border-knight-700/60 rounded-xl px-4 py-2.5 text-sm text-mist-200 focus:outline-none focus:border-maroon-500/50 focus:ring-1 focus:ring-maroon-500/50 transition-all disabled:opacity-50"
                  />
                </div>

                {displayError && <p role="alert" className="text-xs text-red-300 bg-red-950/40 p-2.5 rounded-xl border border-red-800/40">{displayError}</p>}

                <div className="pt-2 flex items-center justify-between gap-3 text-xs text-knight-400">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-maroon-400" /> PBKDF2, 600,000 iterations
                  </span>
                  <span>AES-256-GCM</span>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  {isPasskeySupported && (
                    <button
                      type="button"
                      onClick={() => setShowPassphraseForm(false)}
                      disabled={isProcessing}
                      className="min-h-11 px-4 py-2 rounded-xl text-sm font-medium text-knight-300 hover:text-mist-200 hover:bg-void-800 transition-colors"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isProcessing}
                    className="min-h-11 px-4 py-2 rounded-xl text-sm font-medium text-knight-300 hover:text-mist-200 hover:bg-void-800 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || !passphrase || passphrase.length < 8 || strength.label === 'Weak'}
                    className="min-h-11 px-5 py-2 rounded-xl text-sm font-medium text-white bg-maroon-600 hover:bg-maroon-500 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Encrypting…</> : 'Use passphrase'}
                  </button>
                </div>
              </form>
            )}

            {displayError && !showPassphraseForm && <p role="alert" className="mt-3 text-xs text-red-300 bg-red-950/40 p-2.5 rounded-xl border border-red-800/40">{displayError}</p>}
          </>
        )}
      </div>
    </div>
  );
};
