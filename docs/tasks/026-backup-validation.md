# Task 026: Backup restore and device sync check profiles and settings before writing

Status: planned
Review: required
Goal: A damaged or hand-edited backup file, or bad data received from another device, can no longer put a broken connection profile or setting into IndexedDB. Bad entries are skipped and reported in plain words; good entries restore as before.
Files to touch: new `src/schemas/backupSchema.ts`; `src/io/backup.ts` (`parseBackupPayload` and `restoreFullBackup`: the validation call only); new `test/backupValidation.test.ts`.
Do not touch: `src/db/index.ts` (hooks, schema, tables), the cards and lorebooks schemas, `DeviceSyncPanel.tsx`, `BackupRestoreSection.tsx`, crypto or session code, export code (`createFullBackupJson`, `createFullBackupZip`), zip reading, the 200 MB cap, frozen identifiers. No new npm package (zod is already installed).
Evidence (Claude, 2026-10-30, read of `main` `7da274c`): `src/io/backup.ts` has no schema; it calls `JSON.parse` in six places and only checks `Array.isArray(backupData.cards)`. Restore writes cards with `db.cards.add` or `db.cards.update`, so the Dexie hooks (Zod storage schema on `cards` and `lorebooks`) run for each card. `connectionProfiles` and `settings` have no hooks and are written without any check. `DeviceSyncPanel.tsx` uses the same two functions (`parseBackupPayload` for the preview, `restoreFullBackup(bytes, 'merge')` to apply), so one fix covers file restore and device sync.
Design (the whole spec; do not improvise):
1. `src/schemas/backupSchema.ts` exports `validateBackupData(raw: unknown): { data: FullBackupData; warnings: string[] }`. Pure, no DB, no React.
2. Envelope: `raw` must be a non-null object and `raw.cards` an array; otherwise throw `Error('Invalid backup file: Missing cards list.')` (keep this exact message). If `lorebooks`, `connectionProfiles` or `settings` is present and is not an array, throw `Error('Invalid backup file: <name> must be a list.')`. If one is missing, keep exactly what the code does today (read it first; do not change that behavior). `cards` and `lorebooks` entries pass through untouched (the hooks check them).
3. Each connection profile must be an object with: `uuid` non-empty string, `name` string, `provider` one of `gemini`, `openai`, `anthropic`, `openrouter`, `ollama`, `custom`, `model` string. Read the full `ConnectionProfile` interface in `src/db/index.ts` and give every optional field the type it has there; numbers must be finite. Unknown extra keys are kept (passthrough). An entry that fails is skipped and never written.
4. Each setting must be an object with `key` a non-empty string and `value` present (any JSON value). Extra rule: when `key` is `crypto_mode`, `value` must be a string. An entry that fails is skipped and never written.
5. Reporting: for each kind with skips add one warning line, for example `Skipped 2 connection profiles with invalid data (first: "Name").` and `Skipped 1 setting with invalid data (first key: "x").` Show at most the first one or two names or keys, as plain text. `restoreFullBackup` appends the warnings to its existing `errors` array; do not change its return shape. `parseBackupPayload` returns the filtered data and drops the warnings.
6. Call `validateBackupData` right after the JSON is parsed, in both functions, replacing the `Array.isArray(backupData.cards)` check (same message). Nothing may reach the Dexie transaction without passing it.
7. Hook check (this was an open item in `docs/ARCHITECTURE.md`): add a test that restores in `'merge'` mode a backup with two cards, one valid and one with `cardData: {}`. Expected: no throw, the valid card is stored, the bad card is counted in `cardsSkipped` or described in `errors`. If the real behavior differs (an exception, or the bad card is written), do NOT change `src/db/index.ts`: leave that one test as `it.skip` with a comment, and report exactly what happened in Result. Claude decides what to do.
Tests (`test/backupValidation.test.ts`, vitest; copy the jsdom and `fake-indexeddb` setup from `test/backup.test.ts`; one test per line):
   - A normal export (`createFullBackupJson(false)`) restores with the same counts as before.
   - A profile with `provider: 'bogus'` is skipped, a warning names it, the other profiles restore.
   - A profile with no `uuid` is skipped.
   - A profile with `temperature: 'hot'` is skipped.
   - A profile with an unknown extra key is written and keeps that key.
   - A setting with a numeric `key` is skipped; `crypto_mode` with value 7 is skipped; a normal setting is written.
   - `connectionProfiles: "x"` throws the "must be a list" message; missing `cards` throws the existing message.
   - `parseBackupPayload` on the same bad data returns the filtered profiles and settings.
   - Nothing is written to `db.connectionProfiles` or `db.settings` when the envelope check throws.
   - The hook check from step 7.
Not in this card: streaming or a Web Worker for big files, changing the 200 MB cap (a real library with images may pass 50 MB, so lowering it would block restores), schemas for cards and lorebooks, passkey and API key export choices (Task 027), a new restore screen.
Done when: CI green; Claude's review is Approved (one diff read; check that validation runs before any write and that export code is untouched). Owner, phone: Settings, export a full backup, restore it on the same phone; the summary shows the same counts as before.
Decisions: 1 (no silent data loss: every skip is reported), 2.

## Progress (executor, update every commit)
Done: 
Left: 
Next action: 

## Result (executor, when finished)
Pull request: 
Checks run by executor: 
CI: 
Hook check outcome (step 7): 
Deviations from the card: 

## Review (Claude, required)
