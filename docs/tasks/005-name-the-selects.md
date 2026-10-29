# Task 005: Give every select an accessible name

Status: done
Review: skip
Goal: All 8 `<select>` elements have an accessible name, so screen readers and the audit stop reporting `select-name`.
Files to touch: `src/components/EditorView.tsx` (3 selects, about lines 575, 625, 717), `src/components/editor/AdvancedPromptsSection.tsx` (about line 373), `src/components/crucible/ScenarioPicker.tsx` (about line 164), `src/components/crucible/TrustScoreReportPanel.tsx` (about lines 108 and 130), `src/components/settings/ConnectionProfilesSection.tsx` (about line 505)
Do not touch: option lists, handlers, styling, other elements, frozen identifiers.
Changes:
1. Add an `aria-label` to each select. Where visible text already names it, use the same words: `Turn length`, `Card A`, `Card B`, `Provider`, `Context limit`. The `Provider` label there has no link to its select; `aria-label` is enough, or give both an `id` and `htmlFor`.
2. No visible text: `EditorView.tsx` about line 575 is the export and verify menu, name it for what its first option says. About line 717 is the cover art style, name it `Cover art style`. `AdvancedPromptsSection.tsx` selects the related character, name it `Related character`. Read each select's options first and correct a label that does not match.
3. Labels are short plain English, sentence case.
Done when: CI green. If `scripts/ui-audit.py` can run, the `select-name` count is 0 on Details, Test and Settings. If it cannot run, say so in Result.
Decisions: HANDOFF step 2.

## Progress (executor, update every commit)
Done: Added `aria-label` attributes to the eight selects named in the card: Export card as, Context limit, Cover art style, Related character, Turn length, Card A, Card B, and Provider. No handlers, option lists, styling, or other elements were changed. PR #7 merged after required CI passed.
Left: None.
Next action: None; task complete.

## Result (executor, when finished)
Pull request: #7 — https://github.com/KarlMuzen/RoleplayForge/pull/7
Checks run by executor: Not run locally; `git clone` could not resolve `github.com`. `scripts/ui-audit.py` was not run locally for the same reason.
CI: Green — `test-and-lint` passed on final PR head `ee43810ff581910125b72f784bdb9e4dfa1996b9` (lint, tests, production build). Squash-merged as `5430c0834630248c1d12bdbc2914852dd667d660`.
Preview link: https://roleplayforge-git-wip-005-xiorolab.vercel.app
Deviations from the card: None in code. The local UI audit could not be run in this environment. The first auto-merge request was rejected because the PR was already clean; auto-merge was enabled again during the fresh CI run and GitHub completed the squash merge.

## Review (Claude, if required)
n/a (Review: skip)
