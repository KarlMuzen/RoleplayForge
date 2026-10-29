# Task 018: Undo, Redo and save status in the ContextBar on every Forge tab

Status: in progress
Review: skip
Goal: Undo and Redo are reachable on Details, Lorebook, Prompt and Assist, next to a small save-status chip. They are not shown on Test tabs, which do not edit the card.
Files to touch: `src/components/ContextBar.tsx`, `src/components/EditorView.tsx`, `test/ContextBar.test.tsx`.
Do not touch: the store and its undo/redo logic, the Save Card and Variant buttons in `EditorView.tsx`, other views, frozen identifiers.
Context: HANDOFF step 4, spec UX-UR-1 and section 4.4. Runs after Task 017 is merged. The undo stack holds whole-card snapshots, so edits made on any tab are undoable; the card must prove it with a test.
Changes:
1. In `ContextBar`, in Forge mode only and only with an active card, add to row 1 an Undo button and a Redo button (`Undo` and `Redo` icons from lucide-react, `aria-label="Undo"` and `aria-label="Redo"`, `min-w-11 min-h-11`, `disabled` when `undoStack.length === 0` or `redoStack.length === 0`, calling the store's `undo()` and `redo()`).
2. Next to them add a save-status chip driven by `saveState`: "Saving…" while `saving`, "Saved" while `saved`, "Save failed" while `error`, "Unsaved" while `idle` (`saveState` is `idle | saving | saved | error`). Short text, never wraps, `aria-live="polite"`. Do not add a retry action.
3. In `EditorView.tsx` remove only the Undo and Redo buttons from the top toolbar. Keep the Save Card button and the Variant button as they are. Remove imports and store selectors that become unused so lint stays clean.
4. Tests in `test/ContextBar.test.tsx`: (a) Undo and Redo render on Forge tabs and not on Test tabs; (b) after a change to the active card's lorebook through the store's normal update action, Undo is enabled and clicking it restores the previous lorebook; (c) the chip text follows `saveState`.
Done when: CI green. Owner, phone: on Lorebook and Assist the Undo and Redo buttons are visible; changing a lorebook entry then tapping Undo reverts it; Details no longer shows a second pair of Undo/Redo.
Decisions: 3, 6, 17, 19, 24.

## Progress (executor, update every commit)
Done: Created `wip/018`; added Undo/Redo controls and live save-status chip to ContextBar for Forge tabs with an active card; removed only the duplicate Undo/Redo controls and now-unused imports/selectors from the Details toolbar; added tests for mode gating, lorebook restoration through `updateActiveCardData`, and all save states.
Left: Open the PR and verify CI.
Next action: Open PR #20, check `test-and-lint`, and merge after it is green (Review: skip).

## Result (executor, when finished)
Pull request:
Checks run by executor: Not run locally; the environment could not resolve github.com for a git clone. GitHub Actions is the authoritative CI check.
CI: Pending.
Preview link: n/a (Decision 19)
Deviations from the card: None.

## Review (Claude, if required)
n/a (Review: skip)
