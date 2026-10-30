# Task 028: Screens read lorebooks and cards through the store, and a lint rule keeps it that way

Status: planned
Review: required
Goal: No screen under `src/components` imports the database object `db` directly. The two screens that do today read through the store. A lint rule fails the build if a new one appears.
Files to touch: `src/store/slices/cardSlice.ts` (one new state field and one new action); `src/components/LorebookView.tsx` and `src/components/AssistantView.tsx` (their one `db` read each); `eslint.config.js` (one rule); new `test/lorebookStore.test.ts`.
Do not touch: `src/db/index.ts`, `src/routing/useHashRouting.ts`, `src/services/*`, `src/io/*`, any write path, any other screen's behavior, frozen identifiers. No new npm package.
Evidence (Claude, 2026-10-30, read of `main` `7da274c`): most files under `src/components` import only types from `../db` (`StoredCard` and similar) or constants (`DEFAULT_CRUCIBLE_VECTORS`). Only two import the `db` object: `LorebookView.tsx` line 97 (`db.lorebooks.toArray().then(setDbLorebooks)` in a mount effect, so it never refreshes while the screen stays mounted) and `AssistantView.tsx` line 54 (`db.cards.toArray()` only to get a card count and five names for the context line). No component writes to `db`. The store already holds `cards` and reloads them with `loadCardsFromDb` (which guards against out-of-order results with a request counter).
Design (the whole spec; do not improvise):
1. In `cardSlice.ts` add `lorebooks: StoredLorebook[]` (start `[]`) and `loadLorebooksFromDb: () => Promise<void>`, written like `loadCardsFromDb` (same request-counter guard: only the latest call may set state; on error log with `console.error` and keep the old list).
2. `LorebookView.tsx`: replace the `db.lorebooks.toArray()` effect with a call to `loadLorebooksFromDb()` on mount, and read `lorebooks` from the store instead of the local `dbLorebooks` state (keep the variable names the rest of the file uses where practical). Remove the `db` import; keep the `StoredLorebook` type import.
3. `AssistantView.tsx`: replace the `db.cards` effect by reading `cards` from the store (count and first five names, same fallback "Untitled"). If the store's `cards` might not be loaded when the screen opens, call `loadCardsFromDb()` once on mount. Remove the `db` import; keep the `StoredCard` type import.
4. Wherever the store or an importer writes to `db.lorebooks` (put, add, update, delete, bulk or clear), list those places in Result. If a write happens inside the store, add a `loadLorebooksFromDb()` call after it so the list stays fresh. If a write happens in `src/io/*`, do not change it; list it in Result for Claude.
5. `eslint.config.js`: for `src/components/**/*.{ts,tsx}` add `no-restricted-imports` at level `error` with `patterns: [{ group: ['**/db', '**/db/index'], importNames: ['db'], message: 'Screens must not import the database. Use the store (src/store) instead.' }]`. Type imports and other names from the db module stay allowed. If ESLint 9.21 does not support `importNames` inside `patterns`, stop and report; do not switch to a plugin.
6. If the new rule flags any other file under `src/components` than the two above, do not refactor it: add it to a small explicit override in `eslint.config.js` (`rules: { 'no-restricted-imports': 'off' }` for just those files) with the comment `TODO(028): migrate to the store`, and list the files in Result.
Tests:
   - `test/lorebookStore.test.ts` (jsdom and `fake-indexeddb` as in `test/backup.test.ts`): after storing a lorebook in `db.lorebooks`, `loadLorebooksFromDb()` fills `lorebooks` in the store.
   - Two overlapping `loadLorebooksFromDb()` calls: the later call's result wins (use a second lorebook added between the calls).
   - Existing `GalleryView.test.tsx` and `LibraryMobileUX.test.tsx` and all other tests stay green unchanged.
   - Manual check, reported in Result: add `import { db } from '../db';` to any component, run `npm run lint`, confirm it fails, then remove it.
Not in this card: moving `src/utils` into `src/core`, touching `useHashRouting.ts`, `conversationEngine.ts` or `llmAdapter.ts` (services and routing may use the database), a live-query layer, changing any save path.
Done when: CI green; Claude's review is Approved (one diff read; check that no write path changed and that the lint rule is an error, not a warning). Owner, phone: open the Lorebook screen and the Assist screen; both show the same lorebooks and card count as before.
Decisions: 2 (new state lives in the store, no new folders).

## Progress (executor, update every commit)
Done: 
Left: 
Next action: 

## Result (executor, when finished)
Pull request: 
Checks run by executor: 
CI: 
Direct `db.lorebooks` writes found (step 4): 
Other files flagged by the rule (step 6): 
Deviations from the card: 

## Review (Claude, required)
