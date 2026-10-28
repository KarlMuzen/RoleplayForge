/**
 * True on touch-first devices (phones/tablets) where focusing a text field
 * raises the on-screen keyboard. Used to suppress automatic focus so the
 * keyboard only appears when the user taps a field themselves.
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  return coarse || 'ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
}

/** Whether text inputs may be focused programmatically (desktop only). */
export function canAutoFocusText(): boolean {
  return !isTouchDevice();
}
