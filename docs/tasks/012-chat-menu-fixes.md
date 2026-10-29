# Task 012: Chat menu fixes (follow-ups to Task 008)

Status: in progress
Review: skip
Goal: Three small bugs in the Chat header menu are fixed: the Group Preview count badge sits on its own row, a typed name is kept when the menu closes by tapping outside, and the profile list has no blank choice once a profile is active.
Files to touch: `src/components/ChatPreviewModal.tsx`
Do not touch: anything else in that file (messages, input bar, message actions, Lorebook Debug panel), the store, any other file.
Context: Found in the diff of PR #10 and still present on `main` at `cd2b164`.
Changes:
1. Group Preview badge. In the Group Preview row button, replace the badge `<span className="absolute -top-1 right-1 bg-maroon-500 ... w-4 h-4 ...">` with an inline badge, the way the Lorebook Debug row does it: `<span className="rounded-full bg-maroon-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{groupMemberUuids.length}</span>`. Keep the condition `groupMemberUuids.length > 0`.
2. Name kept on outside tap. Today the name commits only on blur or Enter, and the outside-tap handler unmounts the input first. Add one effect that commits when the menu closes, however it closes:
   `useEffect(() => { if (!isChatMenuOpen) commitUserNameDraft(); }, [isChatMenuOpen]);`
   Use the same `// eslint-disable-next-line react-hooks/exhaustive-deps` comment style already used in this file. Keep the existing onBlur and Enter commits.
3. Profile select. Replace `<option value="">Select profile...</option>` with `{!activeProfile && <option value="" disabled>Select profile...</option>}`. In the select's `onChange`, do nothing when the value is empty: `if (event.target.value) { void setActiveProfileUuid(event.target.value); }`.
Done when: CI green. Owner, phone: with Group Preview members chosen, the count shows inside its menu row; type a name, tap outside the menu, reopen it: the name is kept and new messages use it; with a profile active the profile list has no "Select profile..." entry.
Decisions: 6, 18, 19.

## Progress (executor, update every commit)
Done: Fixed the Group Preview count badge positioning, added a menu-close name commit effect while preserving blur/Enter handling, and prevented the profile select from clearing an active profile via its blank choice.
Left: Open PR, verify `test-and-lint`, record Result, and merge only on green CI.
Next action: Inspect Task 012-only changes and create the PR.

## Result (executor, when finished)
Pull request: 
Checks run by executor: 
CI: 
Preview link: n/a (Decision 19)
Deviations from the card: 

## Review (Claude, if required)
n/a (Review: skip)
