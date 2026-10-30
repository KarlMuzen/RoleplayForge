# Task 021: SillyTavern standalone lorebook files import as lorebooks

Status: done
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
Done: PR #23 was squash-merged to main on 2026-10-30 as `b3d45d6bca305986444bb888d83b0a3ff29aaa36`. `test-and-lint` passed on approved PR head `952f25066890f2dcb39acf190bbd34f078e9ad33` (run 41012058557) and merge commit (run 41012302615). Vercel production deployment `dpl_2J4tLH1zQfRBkBThgFxkCBkThA25` is READY for the merge commit; `roleplayforge.vercel.app` points to it. No recovery deployment was needed.
Left: Owner's phone check of importing a real SillyTavern world-info file remains optional and is not a merge gate.
Next action: Owner can verify the Lorebook tab import on phone; report any issue as a new task.

## Result (executor, when finished)
Pull request: #23 — https://github.com/KarlMuzen/RoleplayForge/pull/23
Merge commit: `b3d45d6bca305986444bb888d83b0a3ff29aaa36` (squash).
Checks run by executor: Not run locally; GitHub CI is authoritative. Claude ran `npm run lint` and `npm test` on the PR head; CI ran the production build.
CI: `test-and-lint` passed on approved PR head `952f25066890f2dcb39acf190bbd34f078e9ad33` (run 41012058557) and merge commit `b3d45d6bca305986444bb888d83b0a3ff29aaa36` (run 41012302615).
Production: READY deployment `dpl_2J4tLH1zQfRBkBThgFxkCBkThA25` serves merge commit `b3d45d6bca305986444bb888d83b0a3ff29aaa36`; alias `roleplayforge.vercel.app` points to that deployment. No recovery was needed.
Deviations from the card: Component-level LorebookView alert tests were skipped as permitted by the card. Real-file and installed-phone checks remain unverified and are not merge gates.

## Review (Claude, required)
Approved (2026-10-30, reviewed at `1d5bae1`; the commits after `62278f1` change only this card).
Read the full source diff against the card: the detector, the `importCardData` branch, the paste check, the two Lorebook handlers and every Gallery branch match the design. Claude ran `npm run lint` (0 errors), `npm test` (42 files, 266 tests, all pass) on the PR head in a fresh clone. Build not run by Claude; CI ran it.
Non-blocking notes (no change needed in this card):
1. In `LorebookView.handleImportLorebook` the new try/catch also wraps `updateLorebook` and `saveActiveCard`. If saving fails, the alert says "Nothing imported" although the lorebook is already applied in memory. Rare; leave for a later card.
2. In `GalleryView`, a `.zip` file whose top-level import returns a lorebook sets `importedAsCharx = true`, so the bulk ZIP extraction is skipped. A ZIP of several files that happens to parse as one lorebook would not be unpacked. Unlikely; not changed.
3. A ZIP that holds only lorebooks shows two warnings (one per lorebook file, plus "No valid character cards found"). Acceptable.
4. Not tested by anyone: the Lorebook screen alert in a browser (component test skipped, allowed by the card) and a real SillyTavern file. Owner phone check stays open and is not a merge gate (Decision 17).
Next: ChatGPT squash-merges by hand, checks that the merge commit has a READY production deployment (Decision 22 if not), then marks this card done.
