import React, { useState } from 'react';
import { useCardStore } from '../store/useCardStore';
import { useModalA11y } from '../hooks/useModalA11y';
import { Lock, Eye, EyeOff, X, Loader2, Fingerprint } from 'lucide-react';

export const DecryptionModal: React.FC = () => {
  const {
    decryptionRequest,
    decryptionError,
    isPasskeyEnrolled,
    isPasskeySupported,
    unlockWithPasskeyAction,
  } = useCardStore();
  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPasskeyProcessing, setIsPasskeyProcessing] = useState(false);

  const [prevRequest, setPrevRequest] = useState(decryptionRequest);
  if (decryptionRequest !== prevRequest) {
    setPrevRequest(decryptionRequest);
    setPassphrase('');
    setIsProcessing(false);
    setIsPasskeyProcessing(false);
  }

  const [prevError, setPrevError] = useState(decryptionError);
  if (decryptionError !== prevError) {
    setPrevError(decryptionError);
    setIsProcessing(false);
  }

  const isVisible = !!decryptionRequest;

  const handleCancel = () => {
    if (isProcessing || isPasskeyProcessing) return;
    if (decryptionRequest?.resolve) {
      decryptionRequest.resolve(null);
    }
    useCardStore.setState({ decryptionRequest: null, decryptionError: null });
  };

  const handlePasskeyUnlock = async () => {
    if (isProcessing || isPasskeyProcessing) return;
    setIsPasskeyProcessing(true);
    try {
      const ok = await unlockWithPasskeyAction();
      if (ok) {
        if (decryptionRequest?.resolve) {
          decryptionRequest.resolve('');
        }
        useCardStore.setState({ decryptionRequest: null, decryptionError: null });
      }
    } finally {
      setIsPasskeyProcessing(false);
    }
  };

  const modalRef = useModalA11y(isVisible, handleCancel);

  if (!decryptionRequest && !isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase || isProcessing || isPasskeyProcessing) return;

    setIsProcessing(true);

    // Yield control briefly to allow React to paint the "Unlocking..." UI state
    // before the main thread is occupied with WebCrypto PBKDF2 key derivation.
    setTimeout(() => {
      decryptionRequest?.resolve(passphrase);
    }, 50);
  };

  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Unlock API Keys"
      tabIndex={-1}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="absolute inset-0 bg-void-950/80 backdrop-blur-sm" onClick={handleCancel} />
      
      <div className={`relative bg-void-900 border border-knight-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl transition-transform duration-300 transform ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <button 
          onClick={handleCancel}
          disabled={isProcessing || isPasskeyProcessing}
          aria-label="Close dialog"
          className="absolute top-3.5 right-3.5 text-knight-400 hover:text-mist-200 p-2 min-w-10 min-h-10 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-fast active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-maroon-500/20 text-maroon-400 flex items-center justify-center border border-maroon-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-mist-100">Unlock API Keys</h2>
            <p className="text-xs text-knight-400">Authenticate to decrypt API credentials for this session</p>
          </div>
        </div>

        {isPasskeyEnrolled && isPasskeySupported && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handlePasskeyUnlock}
              disabled={isProcessing || isPasskeyProcessing}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-void-950 hover:bg-void-850 text-mist-100 hover:text-white border border-knight-700/80 hover:border-maroon-500/60 rounded-xl text-xs font-semibold shadow-sm transition-all touch-fast active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPasskeyProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin text-maroon-400" />
              ) : (
                <Fingerprint className="w-4 h-4 text-maroon-400" />
              )}
              <span>{isPasskeyProcessing ? 'Verifying Passkey...' : 'Unlock with Passkey'}</span>
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="h-px bg-knight-800 flex-1" />
              <span className="text-[10px] text-knight-400 uppercase tracking-wider font-semibold">Or enter passphrase</span>
              <div className="h-px bg-knight-800 flex-1" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Passphrase"
                disabled={isProcessing || isPasskeyProcessing}
                className="w-full bg-void-950 border border-knight-700/60 rounded-xl px-4 py-3 text-sm text-mist-200 focus:outline-none focus:border-maroon-500/50 focus:ring-1 focus:ring-maroon-500/50 transition-all pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
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
            
            {decryptionError && (
              <p className="text-xs text-red-400 mt-2">{decryptionError}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isProcessing || isPasskeyProcessing}
              className="px-4 py-2 rounded-xl text-sm font-medium text-knight-300 hover:text-mist-200 hover:bg-void-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!passphrase || isProcessing || isPasskeyProcessing}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-maroon-500 hover:bg-maroon-400 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Unlocking...</span>
                </>
              ) : (
                'Unlock'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
