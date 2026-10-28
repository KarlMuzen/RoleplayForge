import React from 'react';
import { useDialogStore } from '../store/useDialogStore';
import { useModalA11y } from '../hooks/useModalA11y';
import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';

export const AlertDialogModal: React.FC = () => {
  const { isOpen, options, inputValue, setInputValue, closeDialog } = useDialogStore();

  const modalRef = useModalA11y(isOpen, () => closeDialog(false));

  if (!isOpen || !options) return null;

  const isConfirm = options.type === 'confirm' || options.type === 'prompt';
  const isPrompt = options.type === 'prompt';
  const variant = options.variant || 'info';

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-maroon-400" />,
          iconBg: 'bg-maroon-950/80 border-maroon-800/60',
          btnConfirm: 'bg-maroon-600 hover:bg-maroon-500 text-white',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          iconBg: 'bg-amber-950/80 border-amber-800/60',
          btnConfirm: 'bg-amber-600 hover:bg-amber-500 text-white',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-mist-200" />,
          iconBg: 'bg-void-800 border-knight-700',
          btnConfirm: 'bg-maroon-600 hover:bg-maroon-500 text-white',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={options.title || 'Notification'}
      tabIndex={-1}
      onClick={() => closeDialog(false)}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-void-950/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className="relative bg-void-900 border border-knight-700/60 rounded-2xl p-5 md:p-6 w-full max-w-md shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => closeDialog(false)}
          aria-label="Close dialog"
          className="absolute top-3.5 right-3.5 text-knight-400 hover:text-mist-200 transition-colors p-2 min-w-10 min-h-10 flex items-center justify-center rounded-lg touch-fast active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div className={`p-2.5 rounded-xl border shrink-0 ${vStyles.iconBg}`}>
            {vStyles.icon}
          </div>
          <div className="flex-1 pr-4">
            <h3 className="text-sm font-bold text-mist-100 mb-1">
              {options.title || 'Notice'}
            </h3>
            <p className="text-xs text-knight-300 leading-relaxed whitespace-pre-line">
              {options.message}
            </p>
            {isPrompt && (
              <div className="mt-3">
                <input
                  type="text"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      closeDialog(inputValue);
                    }
                  }}
                  placeholder={options.placeholder || 'Enter value...'}
                  className="w-full px-3 py-2 bg-void-950 border border-knight-700/80 rounded-xl text-xs text-mist-100 placeholder-knight-600 focus:outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-knight-800/50">
          {isConfirm && (
            <button
              onClick={() => closeDialog(false)}
              className="px-4 py-2 bg-void-800 hover:bg-knight-700 text-knight-300 text-xs font-semibold rounded-xl border border-knight-700 transition-all touch-fast active:scale-95"
            >
              {options.cancelText || 'Cancel'}
            </button>
          )}
          <button
            onClick={() => closeDialog(isPrompt ? inputValue : true)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl shadow-md transition-all touch-fast active:scale-95 ${vStyles.btnConfirm}`}
          >
            {options.confirmText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};
