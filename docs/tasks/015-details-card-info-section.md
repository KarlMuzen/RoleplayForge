# Task 015: Details, creator/version/nickname/tags move below the writing fields

Status: done
Review: skip
Goal: On the Details tab, Character Name is followed straight by Description, Personality and Scenario. Creator, Version, Nickname and Tags live in their own "Card Info" section after Advanced Prompts.
Files to touch: `src/components/editor/IdentitySection.tsx`, new `src/components/editor/MetadataSection.tsx`, `src/components/EditorView.tsx`
Do not touch: other files in `src/components/editor/`, the store, field names or `onChange` logic, frozen identifiers.
Context: HANDOFF step 3 and `docs/UI_UX_REDESIGN_SPEC.md` UX-DET-1 (items 1, 2 and 6). Runs after Task 014 is merged. Today four metadata inputs sit between the name and the description, pushing the writing fields off the first phone screen. `creator_notes` stays in Advanced Prompts.
Changes:
1. Create `MetadataSection.tsx` exporting `MetadataSection` with props `{ cardData: CharacterCardV3['data']; updateActiveCardData: (updater: (prev: CharacterCardV3) => CharacterCardV3) => void }` (same types as `IdentitySection`). Wrapper and heading copy the `IdentitySection` style: `<div className="bg-void-900 border border-knight-700/40 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm">` with an `<h3>` reading `Card Info`.
2. Move into it, verbatim (labels, placeholders, classes, `onChange` logic): the Creator / Author input, the Character Version input, the Nickname input, and the Tags input. Keep the two-column grid for the first four and the full-width Tags row, as today.
3. In `IdentitySection.tsx` delete those four inputs. Character Name stays, now alone in a single full-width row (drop the two-column grid around it). Description and the Personality/Scenario grid stay exactly as they are.
4. In `EditorView.tsx` import `MetadataSection` and render `<MetadataSection cardData={d} updateActiveCardData={updateActiveCardData} />` after `<AdvancedPromptsSection ... />` and before the "Cover art and export" `<details>` added by Task 013.
Done when: CI green. Owner, phone, Details tab: Name, then Description right away; after Advanced Prompts a "Card Info" section with Creator, Version, Nickname and Tags, then the collapsed "Cover art and export" row. Editing any of those fields still saves.
Decisions: 6, 17, 19.

## Progress (executor, update every commit)
Done: Added `MetadataSection` with Creator, Version, Nickname and Tags; reduced `IdentitySection` to Character Name followed by Description, Personality and Scenario; inserted `Card Info` after Advanced Prompts and before the existing collapsed cover/export section. Original field names, placeholders, styles, and `onChange` handlers are retained. PR #17 squash-merged.
Left: None.
Next action: Task 015 is complete; wait for the next task.

## Result (executor, when finished)
Pull request: https://github.com/KarlMuzen/RoleplayForge/pull/17
Checks run by executor: Not run locally; repository CI is authoritative.
CI: Passed `test-and-lint` (lint, tests, production build), run 40852384343, on `fd3da66daead39b47a4bfdbc3b680de08215b5b0`.
Preview link: n/a (Decision 19)
Deviations from the card: Auto-merge was rejected with "Pull request is in clean status"; manually squash-merged after `test-and-lint` passed, per Decision 19.

## Review (Claude, if required)
n/a (Review: skip)
