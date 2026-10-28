import React from 'react';
import { useToastStore, type ToastItem } from '../store/useToastStore';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

const ToastIcon: React.FC<{ type?: ToastItem['type'] }> = ({ type }) => {
  switch (type) {
    case 'info':
      return <Info className="w-5 h-5 text-maroon-400 shrink-0" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
    case 'success':
    default:
      return (
        <div className="relative flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        </div>
      );
  }
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:bottom-5 left-1/2 -translate-x-1/2 w-[94%] max-w-sm md:left-auto md:right-5 md:translate-x-0 md:w-full z-[100] flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = !toast.type || toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        let borderClass = 'border-emerald-500/30 bg-void-900/95';
        let glowClass = 'shadow-emerald-950/20';

        if (isWarning) {
          borderClass = 'border-amber-500/30 bg-void-900/95';
          glowClass = 'shadow-amber-950/20';
        } else if (isError) {
          borderClass = 'border-red-500/30 bg-void-900/95';
          glowClass = 'shadow-red-950/20';
        } else if (isInfo) {
          borderClass = 'border-maroon-500/35 bg-void-900/95';
          glowClass = 'shadow-maroon-950/30';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto border backdrop-blur-xl shadow-xl ${glowClass} ${borderClass} rounded-2xl p-3.5 sm:p-4 flex items-start justify-between gap-3 relative overflow-hidden group animate-toast-enter`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <ToastIcon type={toast.type} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-mist-100 flex items-center gap-1.5 leading-tight">
                  {toast.title}
                </span>
                {toast.message && (
                  <p className="text-xs text-knight-300 mt-1 leading-relaxed break-words font-sans">
                    {toast.message}
                  </p>
                )}
                {toast.action && (
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        toast.action?.onClick();
                        removeToast(toast.id);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-500 hover:to-maroon-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all touch-fast active:scale-95 cursor-pointer"
                    >
                      {toast.action.label}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-knight-400 hover:text-mist-100 p-2 min-w-10 min-h-10 flex items-center justify-center rounded-lg hover:bg-void-800 transition-colors shrink-0 touch-fast active:scale-95"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Progress timer bar */}
            {toast.duration && toast.duration > 0 ? (
              <div
                style={{ animationDuration: `${toast.duration}ms` }}
                className={`absolute bottom-0 left-0 h-0.5 animate-toast-progress ${
                  isSuccess
                    ? 'bg-emerald-500/60'
                    : isWarning
                    ? 'bg-amber-500/60'
                    : isError
                    ? 'bg-red-500/60'
                    : 'bg-maroon-500/60'
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
