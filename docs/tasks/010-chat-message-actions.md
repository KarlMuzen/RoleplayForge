# Task 010: Regenerate, edit and delete the last message in Chat

Status: in progress
Review: skip
Goal: Once a chat has started, the last message has three actions: regenerate the reply, edit the text, delete it. This lets a card author retry a reply without resetting the whole chat.
Files to touch: `src/components/ChatPreviewModal.tsx`, `src/utils/chatHistory.ts` (new), `test/chatHistory.test.ts` (new)
Do not touch: `conversationEngine.ts`, the store, the header, the input bar, frozen identifiers.
Context: Start only after Task 009 is merged (same file). Decision 18. Edits live in memory only; they are not saved to the card and are lost on Reset or when the greeting variation changes.
Changes:
1. New `src/utils/chatHistory.ts`, pure functions on `ChatMessage[]` (type from `src/services/conversationEngine.ts`):
   - `hasUserMessage(messages)`: true if any message has `role === 'user'`.
   - `canRegenerate(messages)`: true if the last message has `role === 'assistant'` and an earlier message has `role === 'user'`.
   - `historyForRegenerate(messages)`: the messages up to and including the last user message (drops every assistant message after it).
   - `dropLast(messages)`: all but the last message.
   - `replaceLastText(messages, text)`: a copy with the last message's `text` replaced.
2. In `ChatPreviewModal.tsx`, show an action row under the LAST message bubble only, and only when `hasUserMessage(messages)` and not `isGenerating`. Three buttons, each at least 40px, with an icon and an `aria-label`: `Regenerate reply` (icon `RefreshCw`, shown only when `canRegenerate`), `Edit message` (`Pencil`), `Delete message` (`Trash2`). Check the icons exist in the installed `lucide-react`.
3. Regenerate: set the messages to `historyForRegenerate(messages)`, then run the same generation the Send button runs with an empty user text. `executeConversationTurn` already adds a user message only when the text is not blank, so the engine needs no change. Refactor the generation block of `handleSendMessage` into one function (history, user text) used by both Send and Regenerate, with the same `isGenerating`, typing indicator and error handling. In a group chat, regenerate redoes every character's reply for that turn.
4. Edit: the last bubble turns into a text box (same text size, grows with content) with `Save` and `Cancel`. `Save` is disabled while the text is blank and calls `replaceLastText`. Edit is off while generating.
5. Delete: removes the last message with `dropLast`. No confirmation. In a group chat, deleting the last message removes only that one message.
6. Tests in `test/chatHistory.test.ts` for the five functions, including: no user message gives `canRegenerate` false; a group turn (several assistant messages after one user message) is fully dropped by `historyForRegenerate`; `dropLast` and `replaceLastText` do not change the original array.
Done when: CI green. Owner on the preview, phone: after sending a message, the reply has Regenerate, Edit and Delete under it; Regenerate replaces the reply; Edit changes the text; Delete removes it; before any message is sent no action row shows.
Decisions: 18.

## Progress (executor, update every commit)
Done: Added all five pure `chatHistory.ts` helpers and tests; wired the last-message-only action row, inline edit/save/cancel, delete, and regenerate through the same generation/error/typing path as Send. Header and Task 009 input bar remain intact.
Left: Review scope and code, open PR, verify `test-and-lint`, and merge only when green.
Next action: Inspect the current diff and create the Task 010 PR.

## Result (executor, when finished)
Pull request: 
Checks run by executor: 
CI: 
Preview link: 
Deviations from the card: 

## Review (Claude, if required)
n/a (Review: skip)
