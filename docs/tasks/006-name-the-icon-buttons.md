# Task 006: Name the three unnamed buttons

Status: planned
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
