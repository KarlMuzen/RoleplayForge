import React, { useState } from 'react';
import { useCardStore } from '../store/useCardStore';
import { useModalA11y } from '../hooks/useModalA11y';
import { ShieldCheck, Eye, EyeOff, X, KeyRound, Loader2 } from 'lucide-react';

export const PassphraseSetupModal: React.FC = () => {
  const { passphraseSetupRequest, passphraseSetupError } = useCardStore();
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [prevRequest, setPrevRequest] = useState(passphraseSetupRequest);
  if (passphraseSetupRequest !== prevRequest) {
    setPrevRequest(passphraseSetupRequest);
    setPassphrase('');
    setConfirmPassphrase('');
    setIsProcessing(false);
    setLocalError(null);
  }

  const isVisible = !!passphraseSetupRequest;

  const handleCancel = () => {
    if (isProcessing) return;
    if (passphraseSetupRequest?.resolve) {
      passphraseSetupRequest.resolve(null);
    }
    useCardStore.setState({ passphraseSetupRequest: null, passphraseSetupError: null });
  };

  const modalRef = useModalA11y(isVisible, handleCancel);

  if (!passphraseSetupRequest && !isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!passphrase) {
      setLocalError('Please enter a passphrase.');
      return;
    }

    if (passphrase.length < 8) {
      setLocalError('Passphrase must be at least 8 characters long.');
      return;
    }

    const currentStrength = getStrength(passphrase);
    if (currentStrength.label === 'Weak') {
      setLocalError('Passphrase strength must be at least Moderate.');
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setLocalError('Passphrases do not match.');
      return;
    }

    setIsProcessing(true);

    // Yield control briefly to allow React to paint the loading state
    // before WebCrypto PBKDF2 key derivation occupies the thread.
    setTimeout(() => {
      passphraseSetupRequest?.resolve(passphrase);
    }, 50);
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

  const strength = getStrength(passphrase);
  const displayError = localError || passphraseSetupError;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Establish Master Passphrase"
      tabIndex={-1}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="absolute inset-0 bg-void-950/80 backdrop-blur-sm" onClick={handleCancel} />
      
      <div className={`relative bg-void-900 border border-knight-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl transition-transform duration-300 transform ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <button 
          onClick={handleCancel}
          disabled={isProcessing}
          aria-label="Close dialog"
          className="absolute top-3.5 right-3.5 text-knight-400 hover:text-mist-200 p-2 min-w-10 min-h-10 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-fast active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-maroon-500/20 text-maroon-400 flex items-center justify-center border border-maroon-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-mist-100">Set Master Passphrase</h2>
            <p className="text-xs text-knight-400">Required to encrypt API keys in browser storage</p>
          </div>
        </div>

        <p className="text-xs text-knight-300 mb-4 leading-relaxed bg-void-950/80 p-3 rounded-xl border border-knight-800/80">
          To prevent credentials from being stored in plaintext in IndexedDB, CardCrucible requires a Master Passphrase to encrypt your keys with <strong>AES-256-GCM</strong>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-knight-300 mb-1">Master Passphrase</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter new Master Passphrase"
                disabled={isProcessing}
                className="w-full bg-void-950 border border-knight-700/60 rounded-xl px-4 py-2.5 text-xs text-mist-200 focus:outline-none focus:border-maroon-500/50 focus:ring-1 focus:ring-maroon-500/50 transition-all pr-12 disabled:opacity-50"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isProcessing}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-knight-400 hover:text-mist-200 p-2 min-w-10 min-h-10 flex items-center justify-center rounded-lg touch-fast"
                aria-label={showPassword ? 'Hide passphrase' : 'Show passphrase'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {passphrase && (
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <div className="flex gap-1 items-center">
                  <div className={`h-1.5 w-12 rounded-full ${strength.color}`} />
                  <span className="text-knight-400 ml-1">Strength: <strong className={strength.color.split(' ')[1]}>{strength.label}</strong></span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-knight-300 mb-1">Confirm Passphrase</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              placeholder="Confirm Master Passphrase"
              disabled={isProcessing}
              className="w-full bg-void-950 border border-knight-700/60 rounded-xl px-4 py-2.5 text-xs text-mist-200 focus:outline-none focus:border-maroon-500/50 focus:ring-1 focus:ring-maroon-500/50 transition-all disabled:opacity-50"
            />
          </div>

          {displayError && (
            <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-800/40">{displayError}</p>
          )}

          <div className="pt-2 flex items-center justify-between text-[10px] text-knight-400 font-mono">
            <span className="flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-maroon-400" /> PBKDF2 (600,000 rounds)
            </span>
            <span>AES-256-GCM Zero-Knowledge</span>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-medium text-knight-300 hover:text-mist-200 hover:bg-void-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !passphrase || passphrase.length < 8 || strength.label === 'Weak'}
              className="px-5 py-2 rounded-xl text-xs font-medium text-white bg-maroon-600 hover:bg-maroon-500 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Encrypting...
                </>
              ) : (
                'Establish Passphrase & Encrypt'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
