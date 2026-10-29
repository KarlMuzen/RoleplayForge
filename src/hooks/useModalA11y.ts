import { useEffect, useRef } from 'react';
import { isTouchDevice as checkTouchDevice } from '../utils/touch';

// Back-button support: while a modal is open it owns one history entry, so the
// system Back button closes the modal (through the modal's own close handler and
// its guards) instead of navigating behind it.
const modalStack: symbol[] = [];
let ignorePopsUntil = 0;

export function useModalA11y(isOpen: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Capture previous active element only once when modal opens
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = ref.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusables || focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Initial focus placement inside modal
    const isTouchDevice = checkTouchDevice();

    const timer = setTimeout(() => {
      if (!ref.current) return;

      const firstFocusable = ref.current.querySelector<HTMLElement>(
        'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      // On mobile/touch devices, avoid auto-focusing text input/textarea elements
      // to prevent the software keyboard from abruptly popping up automatically.
      if (firstFocusable) {
        const isTextInput = firstFocusable.tagName === 'INPUT' || firstFocusable.tagName === 'TEXTAREA';
        if (!isTouchDevice || !isTextInput) {
          firstFocusable.focus();
          return;
        }
      }

      // Fallback: focus modal container
      if (ref.current && typeof ref.current.focus === 'function') {
        ref.current.focus();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const token = Symbol('modal');
    let owned = false; // true while our history entry is on the stack
    let disposed = false;

    const push = () => {
      window.history.pushState({ rfModal: true }, '', window.location.href);
      modalStack.push(token);
      owned = true;
    };

    const onPop = () => {
      if (performance.now() < ignorePopsUntil) return; // pop we triggered ourselves
      if (modalStack[modalStack.length - 1] !== token) return; // only the top modal reacts
      owned = false;
      modalStack.pop();
      onCloseRef.current();
      window.setTimeout(() => {
        // The modal refused to close (e.g. recovery key not yet saved): keep Back trapped.
        if (!disposed && isOpenRef.current && !owned) push();
      }, 50);
    };

    push();
    window.addEventListener('popstate', onPop);
    return () => {
      disposed = true;
      window.removeEventListener('popstate', onPop);
      const i = modalStack.lastIndexOf(token);
      if (i >= 0) modalStack.splice(i, 1);
      if (owned && (window.history.state as { rfModal?: boolean } | null)?.rfModal) {
        ignorePopsUntil = performance.now() + 150;
        window.history.back();
      }
    };
  }, [isOpen]);

  return ref;
}
