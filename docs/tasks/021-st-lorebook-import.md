# Task 021: SillyTavern standalone lorebook files import as lorebooks

Status: planned
Review: required
Goal: A SillyTavern world-info file (`{"entries": {"0": {...}}}`, no `spec`) imports as a lorebook on the Lorebook screen instead of silently doing nothing, and never becomes a nameless junk card in the Library or the paste box.
Files to touch: `src/utils/normalizeLorebook.ts` (one new exported helper); `src/io/index.ts` (JSON branch of `importCardData` only); `src/core/pasteImport.ts` (the one `lorebook_v3` check); `src/components/LorebookView.tsx` (the two import handlers, message only); `src/components/GalleryView.tsx` (message only); new `test/lorebookImport.test.ts`.
Do not touch: `converter.ts`, schemas, store, DB, PNG/CHARX code, the Chub import, any other behavior of file or paste import, frozen identifiers. No new npm package.
Evidence (Claude, 2026-10-30, throwaway test, not committed): `importCardData('{"entries":{"0":{"uid":0,"key":["dragon"],"keysecondary":["fire"],"comment":"Dragon","content":"Big lizard","order":100,"disable":false}}}', 'world.json')` returns `format: 'json'`, `lorebook: undefined`, and a card with empty name and 1 entry in `character_book`. `LorebookView.handleImportLorebook` and `handleAddImportedLayer` only read `result.lorebook`, so the owner sees nothing happen and no message. The Library would create the nameless card. `normalizeLorebook` already converts the dict form and `key`/`keysecondary` correctly; only the detection is missing. Source for the file shape: `docs/research/001-st-spec-verification.md`, claim 1.
Design (the whole spec; do not improvise):
1. `normalizeLorebook.ts` exports `looksLikeStandaloneLorebook(value: unknown): boolean`. True only when `value` is a plain object, not an array, and has an `entries` property that is an array or a non-null object, and none of these hold: `spec` is a string starting with `chara_card`; it has a `data` property that is an object; it has any of `first_mes`, `mes_example`, `personality`, `scenario`, `char_greeting`, `char_name`. `name` and `description` are allowed.
2. `importCardData`, JSON branch, right after the existing `lorebook_v3` check and before the avatar code: if `looksLikeStandaloneLorebook(parsed)`, call `normalizeLorebook(parsed)`. If it returns a lorebook, set its `name` to `parsed.name` when that is a non-empty string, else to the file name without extension (when `fileName` is given), and return `{ format: 'lorebook', lorebook, warnings: [] }`. If `normalizeLorebook` returns undefined, continue exactly as today. Nothing else in `importCardData` changes.
3. `pasteImport.ts`: the existing check `parsed.spec === 'lorebook_v3'` becomes `parsed.spec === 'lorebook_v3' || looksLikeStandaloneLorebook(parsed)`. Same result kind (`lorebook-json`), same warning text, no card.
4. `LorebookView.tsx`: in `handleImportLorebook` and `handleAddImportedLayer`, when `result.lorebook` is missing, show `useDialogStore.getState().showAlert('No lorebook found in this file. A lorebook file has an "entries" list.', 'Nothing imported', 'warning')`. Wrap the `importCardData` call in try/catch and show the thrown message the same way. Success paths unchanged.
5. `GalleryView.tsx`: in the file-import flow, wherever a result has `lorebook` and no `card`, do not create a card; add the warning `<file name>: This file is a lorebook, not a character card. Open a card and import it in the Lorebook tab.` to the collected warnings (same list the other per-file warnings use) and continue with the next file. Find every such branch (single file, ZIP entries); do not change anything else there. The Chub flow is not touched.
Tests (`test/lorebookImport.test.ts`, vitest, no DOM unless a component test is cheap; if a component test for the LorebookView alert is too costly, skip it and say so in Result):
   - The probe file above gives `format: 'lorebook'`, 1 entry, `keys` `['dragon']`, `secondary_keys` `['fire']`, `content` "Big lizard", entry enabled; name is `world` when the file name is `world.json`.
   - `disable: true` gives an entry that is not enabled.
   - Entries as an array (`{"entries":[{"key":["a"],"content":"x"}]}`) also gives `format: 'lorebook'`.
   - `{"entries":{},"name":"Empty"}` keeps today's behavior (no regression: whatever `importCardData` returned before, it still returns; assert it does not throw).
   - Regression: a V2 card with `character_book` and a V3 card with `character_book` still give `format: 'json'` with a card; `{"spec":"lorebook_v3",...}` still gives `format: 'lorebook'`; `{"entries":{"0":{"content":"x"}},"first_mes":"hi"}` is still treated as a card.
   - `looksLikeStandaloneLorebook` truth table for the rules in step 1 (arrays, null, strings, card shapes).
   - Paste: `readPastedText` of the probe file gives `kind: 'lorebook-json'` and no card.
   - Encoding guard (no code change expected): a card whose description is `em—dash ’quote “smart” 日本` goes through `exportCardData(card, 'png')` then `importCardData` and comes back byte-identical. If this fails, stop and report; do not fix inside this card.
Done when: CI green. Owner, phone: open a card, Lorebook tab, import a SillyTavern world-info `.json`: the entries appear. Import the same file in the Library: no card is created and a warning says it is a lorebook.
Decisions: 1 (no silent data loss), 25.
Not in this card: PNG duplicate-chunk selection (open decision, see `PROJECT_STATE.md` risks), lorebook list paging, linter changes, receipts.

## Progress (executor, update every commit)
Done: 
Left: 
Next action: 

## Result (executor, when finished)
Pull request: 
Checks run by executor: 
CI: 
Deviations from the card: 

## Review (Claude, required)
Approved | Changes needed: <list>
