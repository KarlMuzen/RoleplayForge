# Task 006: Name the three unnamed buttons

Status: in progress
Review: skip
Goal: The 3 icon-only buttons the audit flagged (2 on the Assist screen, 1 on Settings) get an accessible name.
Files to touch: `src/components/AssistantView.tsx` and the one file under `src/components/settings/` that holds the Settings button. At most 3 files.
Do not touch: visuals, handlers, other buttons that already have a name, frozen identifiers.
Changes:
1. Find them. Preferred: run `scripts/ui-audit.py` and read the axe rule `button-name` for Assist and Settings. If it cannot run, search `AssistantView.tsx` and `src/components/settings/*.tsx` for `<button>` elements that hold only an icon and have no `aria-label`, text or `title`.
2. Add an `aria-label` to each: a short verb phrase for what the button does (for example `Remove model`). Read the button's handler before naming it.
3. In Result, list the 3 buttons fixed (file, line, label). If you find a different number, say so.
Done when: CI green. `button-name` count is 0 on Assist and Settings if the audit can run; otherwise say it could not.
Decisions: HANDOFF step 2.

## Progress (executor, update every commit)
Done: Added accessible names to the two Assist buttons (`Generate cover`, `Send message`) and the Settings API-key visibility toggle (`Show API key` / `Hide API key`). Each label matches its handler; no visuals or handlers changed.
Left: Verify CI for the final task-card update, retry auto-merge, and confirm the squash merge.
Next action: Enable auto-merge when the new required check is pending.

## Result (executor, when finished)
Pull request: #8 — https://github.com/KarlMuzen/RoleplayForge/pull/8
Checks run by executor: Not run locally; `git clone` could not resolve `github.com`. `scripts/ui-audit.py` was not run locally for the same reason.
CI: `test-and-lint` passed on implementation commit `3896f7a1489d56571b1df0506675c79c041f4214` (lint, tests, production build). The final task-card update will trigger a fresh required check before merge.
Preview link: https://roleplayforge-git-wip-006-xiorolab.vercel.app
Deviations from the card: Exactly three unnamed controls were identified and named: `AssistantView.tsx:372` — `Generate cover`; `AssistantView.tsx:549` — `Send message`; `ConnectionProfilesSection.tsx:562` — `Show API key` / `Hide API key`. The local UI audit could not be run. GitHub rejected the first auto-merge request with “Pull request is in clean status”; it will be retried during the fresh CI run, with manual squash merge as fallback.

## Review (Claude, if required)
n/a (Review: skip)
