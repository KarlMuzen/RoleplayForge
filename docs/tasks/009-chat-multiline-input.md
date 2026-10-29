# Task 009: Multi-line message box in Chat

Status: done
Review: skip
Goal: The Chat message box takes several lines. On a phone Enter adds a new line and the send button sends. On a computer Enter sends and Shift+Enter adds a new line.
Files to touch: `src/components/ChatPreviewModal.tsx`, `src/utils/chatKeys.ts` (new), `test/chatKeys.test.ts` (new)
Do not touch: `conversationEngine.ts`, the store, the header, the message list, the Assist screen's input (not in this card), frozen identifiers.
Context: Roleplay messages often run to several lines; today the box is a single-line `<input>`. Start only after Task 008 is merged (same file). Decision 18.
Changes:
1. New `src/utils/chatKeys.ts` exporting `shouldSendOnEnter(event: { key: string; shiftKey: boolean; isComposing?: boolean }, isTouchDevice: boolean): boolean`. It returns true only when `key === 'Enter'`, `shiftKey` is false, `isComposing` is not true, and `isTouchDevice` is false.
2. In `ChatPreviewModal.tsx` replace the message `<input>` (about line 522, in the Input Bar) with a `<textarea>`: `rows={1}`, `resize-none`, `overflow-y-auto`, `max-h-40`, same look classes as today, same placeholder `Reply to <name>...`, `aria-label="Message"`. It grows with its content up to about 6 lines (on change set `style.height = 'auto'`, then `Math.min(scrollHeight, 160)` px), then scrolls inside. When the text is cleared after sending, the height goes back to one row.
3. `onKeyDown`: if `shouldSendOnEnter(e, isTouchDevice)` then `e.preventDefault()` and send. Otherwise do nothing, so the browser adds the new line. `isTouchDevice` is `window.matchMedia?.('(pointer: coarse)').matches ?? false`, read once per render of the component (guard so tests without `matchMedia` do not throw).
4. The row holding the box and the send button uses `items-end` so the send button stays at the bottom while the box grows. The send button keeps its `aria-label="Send message"` and its disabled rule.
5. Tests in `test/chatKeys.test.ts`: Enter alone sends on a computer; Shift+Enter does not; Enter does not send on a touch device; Enter during composition does not send; other keys do not send.
Done when: CI green. Owner on the preview, phone: Enter makes a new line, the box grows to about 6 lines and then scrolls, the send button sends, and the message shows its line breaks in the bubble.
Decisions: 18.

## Progress (executor, update every commit)
Done: Replaced the single-line Chat input with an autosizing textarea (capped at 160px, scrollable after the cap, reset on clear), bottom-aligned the send button, added `shouldSendOnEnter`, covered all five required behaviors, and squash-merged PR #12.
Left: None.
Next action: Task 009 is complete; proceed to Task 010.

## Result (executor, when finished)
Pull request: https://github.com/KarlMuzen/RoleplayForge/pull/12
Checks run by executor: Not run locally; repository CI is authoritative.
CI: Passed `test-and-lint` (lint, tests, production build), run 40844640629, on `620288e54540ba49e74e34ed9d60ce45bf8710b8`.
Preview link: n/a (Decision 19)
Deviations from the card: Auto-merge was rejected with "Pull request is in clean status"; manually squash-merged after `test-and-lint` passed, per Decision 19.

## Review (Claude, if required)
n/a (Review: skip)
