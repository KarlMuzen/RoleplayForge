import React, { useEffect, useRef, useState } from 'react';
import { Ellipsis, Zap } from 'lucide-react';

interface ContextMoreMenuProps {
  showPreFlight: boolean;
  onPreFlightAudit: () => void;
  onHelp: () => void;
}

export const ContextMoreMenu: React.FC<ContextMoreMenuProps> = ({
  showPreFlight,
  onPreFlightAudit,
  onHelp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  const choosePreFlightAudit = () => {
    setIsOpen(false);
    onPreFlightAudit();
  };

  const chooseHelp = () => {
    setIsOpen(false);
    onHelp();
  };

  return (
    <div ref={containerRef} className="relative sm:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-label="More actions"
        aria-expanded={isOpen}
        aria-controls="context-more-actions"
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-w-11 min-h-11 items-center justify-center rounded-lg border border-knight-700/50 bg-void-900/60 text-knight-300 transition-colors hover:bg-void-800 hover:text-mist-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 touch-fast"
      >
        <Ellipsis className="w-5 h-5" aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          id="context-more-actions"
          role="group"
          aria-label="More actions"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-knight-700 bg-void-950 p-2 shadow-xl"
        >
          {showPreFlight && (
            <button
              type="button"
              onClick={choosePreFlightAudit}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold text-mist-100 transition-colors hover:bg-void-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-maroon-400" aria-hidden="true" />
                Pre-Flight Audit
              </span>
              <span className="rounded border border-emerald-800 bg-emerald-950 px-1 py-0.5 font-mono text-[9px] text-emerald-400">
                Free
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={chooseHelp}
            className="flex min-h-11 w-full items-center rounded-lg px-3 py-2 text-left text-xs font-semibold text-mist-100 transition-colors hover:bg-void-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            Help and documentation
          </button>
        </div>
      )}
    </div>
  );
};
