# Task 004: Chat button on Details

Status: in progress
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
Done: Changed only the Chat button condition in `WorkspaceSubNav.tsx` so it renders whenever `activeCard` exists, including on Details. Kept `sm:hidden` and all button styling unchanged.
Left: Verify CI for the final task-card update, retry auto-merge, and confirm the squash merge.
Next action: Enable auto-merge when the new required check is pending.

## Result (executor, when finished)
Pull request: #6 — https://github.com/KarlMuzen/RoleplayForge/pull/6
Checks run by executor: Not run locally; `git clone` could not resolve `github.com`. GitHub CI is authoritative.
CI: `test-and-lint` passed on implementation commit `29213f49c6c40dca0a470ad47a75df2432ebec6d` (lint, tests, production build). The final task-card update will trigger a fresh required check before merge.
Preview link: https://roleplayforge-git-wip-004-xiorolab.vercel.app
Deviations from the card: None in the code change. GitHub rejected the first auto-merge request with “Pull request is in clean status”; auto-merge will be retried during the fresh CI run, with manual squash merge as the fallback.

## Review (Claude, if required)
n/a (Review: skip)
