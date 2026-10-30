# Task 031: Phone layout and honest wording for the audit sheet and the backup note

Review: skip
Goal: The Pre-flight audit sheet shows its issue list on a phone, says only what the code does, and the Settings backup note matches the export dialog.
Files to touch: `src/components/PreFlightAuditModal.tsx`, `src/components/settings/BackupRestoreSection.tsx`.
Do not touch: `src/utils/writingLint.ts` (keep `tokenSavingsEstimate`; it just stops being shown), `src/io/*`, `src/store/*`, `src/db/*`, any test file, frozen identifiers. No new npm package.
Evidence (Claude, 2026-10-31, read of `main` `e1ad9a7`, the code lines below were read on that SHA; not checked on a phone): in `PreFlightAuditModal.tsx` the summary banner is `grid grid-cols-1 sm:grid-cols-4` (line 123), so on a phone the three boxes stack above the list inside a `max-h-[90vh]` modal with `overflow-hidden`; the filter row is `flex gap-1.5` with no wrap (line 158); the list is `overflow-y-auto ... grow` (line 203). The box text says "Saves an estimated ~{lintResult.tokenSavingsEstimate + 150} tokens per test run" (line 151): the estimate is duplicated sentences x 25 plus a literal 150, and nothing measures test runs. The footer says "{lintResult.issues.length} writing heuristics checked in real time" (line 298), but that number is the issues found. In `BackupRestoreSection.tsx` line 125 the note says "Backups include your saved connection credentials (API keys).", but since Task 027 the export dialog has a checkbox "Include API keys in this backup" and it starts unchecked for passkey-only users.

Change 1 (phone layout, `PreFlightAuditModal.tsx`):
1. Summary banner: change `grid-cols-1 sm:grid-cols-4` to `grid-cols-2 sm:grid-cols-4`. Give the third box (the one with `sm:col-span-2`) `col-span-2` so it spans the full row on a phone. Reduce the banner's `gap-3 mb-4` to `gap-2 mb-3 sm:gap-3 sm:mb-4`.
2. Filter row: on the `flex gap-1.5` div that holds the four filter buttons add `flex-wrap`.
3. Issue list: add `min-h-0` to the `overflow-y-auto space-y-3 pr-1 grow` div so it can shrink and scroll inside the modal.
Done when: CI green. Owner, phone: open the Pre-flight audit; the issue list is visible and scrolls without scrolling the page, and all four filter buttons can be tapped.

Change 2 (wording, `PreFlightAuditModal.tsx`):
1. In the third box, replace the sentence "Saves an estimated ~{...} tokens per test run." with "Uses no AI tokens." Keep the rest of the paragraph and the box title unchanged. Remove the `{lintResult.tokenSavingsEstimate + 150}` expression.
2. Footer: replace `{lintResult.issues.length} writing heuristics checked in real time` with `{lintResult.issues.length} issues found. Checked on your device, no AI used.`
Done when: CI green. Owner, phone: the audit sheet shows no token-saving number and the footer reads as above.

Change 3 (wording, `BackupRestoreSection.tsx`):
1. Replace "Note: Backups include your saved connection credentials (API keys)." with "Note: Backups can include your saved API keys. You can leave them out when you export."
Done when: CI green. Owner, phone: Settings, Backup shows the new note; the export dialog is unchanged.

Stops (send one message, do not improvise): any line above does not match the file; the unused-variable lint rule fails because `tokenSavingsEstimate` is no longer read (it is a field of an object, so it should not); the change needs a file outside the two listed.
Checks: `npm run lint && npm test && npm run build`. Existing tests stay green and unchanged.
Decisions: 7 (say only what the code does), 8.
