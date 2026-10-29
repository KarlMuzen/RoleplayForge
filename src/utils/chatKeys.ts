export function shouldSendOnEnter(
  event: { key: string; shiftKey: boolean; isComposing?: boolean },
  isTouchDevice: boolean
): boolean {
  return (
    event.key === 'Enter' &&
    !event.shiftKey &&
    event.isComposing !== true &&
    !isTouchDevice
  );
}
