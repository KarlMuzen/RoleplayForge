# Task 004: Chat button on Details

Status: planned
Review: skip
Goal: The phone `Chat` button shows on every Forge tab, including Details, not only on some.
Files to touch: `src/components/WorkspaceSubNav.tsx`
Do not touch: `LabSubNav.tsx`, `Navigation.tsx`, the Chat preview itself, frozen identifiers.
Changes:
1. Read lines 125-165. The Chat button is shown when `activeCard && activeTab !== 'editor'`. Change the condition to `activeCard` only. Keep `sm:hidden` (desktop already has `Test Chat` in the side nav) and keep the button's look.
2. Change nothing else. HANDOFF step 4 will replace this nav, so keep this to the one condition.
Done when: CI green. Owner on the preview, phone: Details shows the same Chat button as Lorebook, and the header does not wrap or overflow with a long card name at 360px width. If it does overflow, stop and say so in Result instead of redesigning the header.
Decisions: HANDOFF finding 4.

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
