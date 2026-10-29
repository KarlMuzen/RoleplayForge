# Task 005: Give every select an accessible name

Status: planned
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
