# Task 008: Chat header menu, profile switch, name no longer wipes the chat

Status: planned
Review: skip
Goal: The Chat header is one clean row on a phone (back, avatar, character name, one menu button). Name, model profile, Lorebook Debug, Group Preview and Reset live in that menu. Typing your name never erases a chat in progress.
Files to touch: `src/components/ChatPreviewModal.tsx`
Do not touch: `conversationEngine.ts`, the store (`profileSlice.ts`), `CardAvatar.tsx`, the contents of the Lorebook Debug panel, the greeting bar, the message list, the input bar, frozen identifiers.
Context: Chat is a card test bench, not a chat host (Decision 18). The idea is taken from Chub's chat menu, scoped down. Task 007 (merged) added a phone-only name row as a stopgap; this card replaces it.
Changes:
1. Header row (about lines 218-345): keep the back button, the avatar and the title with its tokens/profile line. After them put one menu button. Icon: `EllipsisVertical` from `lucide-react` (check it exists in the installed version under `node_modules/lucide-react`; if not, use `MoreVertical`). Size `min-w-10 min-h-10`, `aria-label="Chat menu"`, `aria-haspopup="true"`, `aria-expanded` set to the open state. Remove from the header: the User-name box, the Lorebook Debug, Group Preview and Reset buttons, and the phone-only name row from Task 007 (the `sm:hidden` row just under the header). Keep the right-hand close X only at `sm` and wider (`hidden sm:flex`); on phones the back arrow closes the chat.
2. Menu panel: opens right under the menu button, right-aligned. Wrapper `relative`; panel `absolute right-0 top-full mt-2 z-30 w-72 max-w-[calc(100vw-1.5rem)] max-h-[70dvh] overflow-y-auto rounded-xl border border-knight-700/60 bg-void-900 shadow-2xl p-2`. Solid background, nothing see-through. It closes on a tap outside (replace the existing `groupPickerRef` outside-click effect with one for the menu) and after the Reset item is chosen. Each row is at least 44px tall:
   a. Your name: label plus a text input. `data-testid="chat-user-name"`, `aria-label="Your name in the chat"`, placeholder `User`.
   b. Model profile: a `<select aria-label="Model profile">` listing `profiles` from `useCardStore` (option text = profile name), value `activeProfileUuid`, `onChange` calls `setActiveProfileUuid(value)` from the same store. If there are no profiles show the text `No profile. Add one in Settings.` instead of the select. Under it, small text: `Same profile as Settings.`
   c. Lorebook Debug: toggles the existing debug panel. Show the number of activated entries as a small badge when it is above 0 (existing indigo style).
   d. Group Preview: toggles the existing character checklist. Move that checklist's markup out of the old popover and render it inline under this row when open; delete the old popover. Keep the count badge.
   e. Reset chat: calls the existing `handleResetChat`.
3. Title area: with the extra buttons gone, the character name must show at least 12 characters on a 393px-wide phone before it is cut with `...`. Keep `truncate`.
4. The name no longer wipes the chat. Today the effect that rebuilds the messages (about line 84) lists `userName` in its dependencies, so every keystroke in the name box erases the conversation. Fix: the input edits a `userNameDraft`; commit it to `userName` on blur and on Enter (an empty draft becomes `User`). Remove `userName` from that effect's dependencies. Add a second small effect: when `userName` changes and no message has `role === 'user'` (chat not started), rebuild the greeting messages as today. If the chat has started, leave the history alone; the new name applies to new messages and labels only.
5. If any test refers to the old test ids `chat-user-name-header` or `chat-user-name-phone`, update it to `chat-user-name`.
Done when: CI green. Owner on the preview, phone: the Chat header is one row with the character name readable; the menu has a solid background and shows name, model profile, Lorebook Debug, Group Preview and Reset chat; choosing another profile changes the `Profile:` text under the title; after sending a message, editing the name keeps the conversation.
Decisions: 6, 18.

## Progress (executor, update every commit)
Done: 
Left: 
Next action: 

## Result (executor, when finished)
Pull request: 
Checks run by executor: 
CI: 
Preview link: 
Deviations from the card: 

## Review (Claude, if required)
n/a (Review: skip)
