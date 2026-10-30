# Task 027: Backup export lets you leave API keys out

Status: planned
Review: required
Goal: The Settings backup export has a checkbox "Include API keys in this backup". It starts checked, as today, except when the app uses a passkey-only vault: then it starts unchecked and a warning explains why.
Files to touch: `src/components/settings/BackupRestoreSection.tsx` (export modal and `confirmExport` only); new `test/backupExportKeys.test.ts`.
Do not touch: `src/io/backup.ts`, the store and its slices, crypto or session code, the restore code, `DeviceSyncPanel.tsx`, frozen identifiers. No new npm package.
Evidence (Claude, 2026-10-30, read of `main` `7da274c`): `BackupRestoreSection.tsx` always calls `createFullBackupJson(true)` and `createFullBackupZip(true)`, so every Settings backup carries the API keys and the device security settings (`crypto_salt`, `crypto_hash`, `crypto_mode`, the three `crypto_recovery_*` keys, and `passkey_credential_id`, `passkey_wrapped_key`, `passkey_prf_salt`). Both export functions already support `false`: they drop `apiKey`, set `apiKeyRedacted: true`, and filter those settings. With `crypto_mode` = `passkey-only-v1` the keys are wrapped by a passkey on the original device; whether another device can open them after a restore is not verified, so the warning below says "may not".
Design (the whole spec; do not improvise):
1. Add `includeKeys: boolean` to the export modal state. When the modal opens, set it to `!isPasskeyOnly`. Read `isPasskeyOnly` from the store the same way the component already reads `profiles`; do not add store fields.
2. In the modal body add a checkbox row at least 44px high, label "Include API keys in this backup". Under it show one line, as React text:
   - checked and `isPasskeyOnly`: amber, "Your keys are locked to a passkey. A device without the same passkey may not be able to open them. Leave keys out and enter them again on the new device, or keep this file only for this device."
   - unchecked: "API keys and key-protection settings are left out. After restoring, enter your keys again."
   - checked and not `isPasskeyOnly`: show nothing new; the two existing paragraphs stay as they are.
3. `confirmExport` passes `includeKeys` to `createFullBackupJson` and `createFullBackupZip` instead of the fixed `true`.
4. The existing plaintext-keys paragraph (`hasPlaintext`) is shown only while `includeKeys` is true.
5. When `includeKeys` is false, add " API keys were left out." to the success toast message.
6. Restore, sync and the file format do not change.
Tests (`test/backupExportKeys.test.ts`, vitest, jsdom plus `fake-indexeddb` as in `test/backup.test.ts`; one test per line):
   - With a profile whose `apiKey` is `enc.v1.x` and settings `crypto_mode`, `passkey_credential_id`, `crypto_salt` stored, `createFullBackupJson(false)` has no `apiKey` on the profile, has `apiKeyRedacted: true`, and contains none of those setting keys.
   - `createFullBackupJson(true)` on the same data keeps the key and all three settings (regression guard).
   - If `test/` has a render pattern for settings components (look for `render(` in `test/`), add one test that the checkbox is unchecked when `isPasskeyOnly` is true and checked when it is false. If there is no workable pattern, say so in Result and verify by reading the code.
Not in this card: re-wrapping keys with a passphrase, a recovery-key flow after restore, any restore behavior, device sync (it already sends no API keys).
Done when: CI green; Claude's review is Approved (one diff read; check that `true` is no longer hard-coded and the default follows `isPasskeyOnly`). Owner, phone: Settings, Backup, Export; the checkbox is visible and easy to tap; with it unchecked, the saved file contains no API key.
Decisions: 1, 7.

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
