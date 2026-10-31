# Task 038: Two wording fixes (Guide claim, export dialog title)

Review: skip
Goal: Remove a compatibility claim the repo cannot back, and make the backup export dialog title follow the "Include API keys" checkbox.
Files to touch: `src/components/GuideView.tsx`, `src/components/settings/BackupRestoreSection.tsx`, and a test only if one asserts the old text.
Do not touch: `src/io/`, `src/store/`, any other file, and nothing in the export dialog besides its title text (not the icon, colors, button, checkbox, messages or handlers).
Changes (two independent changes):
A. Guide claim. In `src/components/GuideView.tsx` the text "Save PNG tEXt chunks or CHARX zip bundles compatible with SillyTavern & Agnaistic." becomes "Save PNG tEXt chunks or CHARX zip bundles compatible with SillyTavern." There is no Agnaistic fixture or adapter in the repo, so the claim is unproven (`docs/BUGS.md`, verified).
   Done when: a search for "Agnaistic" in `src/components` finds nothing, and the Guide line reads as above.
B. Export dialog title. In `src/components/settings/BackupRestoreSection.tsx` the `<h2>` is `{exportModalState.hasPlaintext ? 'Export Plaintext Keys' : 'Export Encrypted Backup'}`. Make it: when `exportModalState.includeKeys` is false, "Export Backup (no API keys)"; when it is true, the existing expression unchanged. The exported file is already correct; only the title was wrong with the box unchecked.
   Done when: in Settings, Backup, opening the export dialog and unticking "Include API keys in this backup" changes the title to "Export Backup (no API keys)" at once, and ticking it again brings the old title back.
If a test asserts the old Guide text or the old title, update that one assertion. Add no new tests.
Done when (both): CI green and the two checks above.
Decisions: none
