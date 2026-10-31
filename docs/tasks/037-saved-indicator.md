# Task 037: Save indicator no longer flips back to "Unsaved"

Review: skip
Goal: After a card is saved, and while a card is open with no edits, the save indicator in the ContextBar reads "Saved" with the green dot; it reads "Unsaved" never.
Files to touch: `src/components/ContextBar.tsx`, `test/ContextBar.test.tsx`
Do not touch: `src/store/` (including the 2 second reset to `idle` in `cardSlice.ts` and the `saveState` values), `src/routing/`, `src/components/EditorView.tsx`, any other file.
Evidence (verified by Claude at `main` `bfef563`): every edit made through `updateActiveCardData` calls `triggerAutosave`, which sets `saveState` to `saving`, then `saved`, then back to `idle` two seconds later (`src/store/slices/cardSlice.ts`). `ContextBar.tsx` shows `idle` as "Unsaved" with the amber dot, so a card saved a minute ago reads "Unsaved" (the owner saw this twice on the phone). `idle` is also the state of an open card with no edits, and `src/routing/useHashRouting.ts` sets `idle` after it flushes a pending save when switching cards. So `idle` means nothing is pending, not that something is unsaved.
Changes:
1. Before editing, search `src/` for any place that changes the active card without going through `updateActiveCardData`, `undo`, `redo`, `saveActiveCard`, `saveActiveCardMetadata`, `restoreSnapshot`, `selectCardForEditing`, `deleteCard` or `bulkDeleteCards` (for example another `set({ activeCard` or `setState({ activeCard`). If one exists that neither autosaves nor saves, stop and send one message: the idea that `idle` means nothing pending would be wrong and the card needs a rethink.
2. In `src/components/ContextBar.tsx`, treat `idle` the same as `saved` in both places that read `saveState`: the text ("Saved") and the dot (the emerald one). `saving` ("Saving…", cyan) and `error` ("Save failed", red) stay as they are. No other change.
3. In `test/ContextBar.test.tsx`, read how the file sets `saveState`. Update any test that expects "Unsaved" for `idle`. Add one test: with `saveState` `idle` the bar shows "Saved" and not "Unsaved"; with `saving` it shows "Saving…"; with `error` it shows "Save failed".
Done when: CI green. On the phone: open a card with no edits and the dot is green; edit a field and the dot goes cyan, then green and stays green; the amber dot and "Unsaved" never appear.
Decisions: 24
