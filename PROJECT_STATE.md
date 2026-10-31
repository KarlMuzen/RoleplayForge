# PROJECT_STATE

Entry point for any AI or human picking up work. The repo is the source of truth, not chat history. Read this, then `docs/AI_WORKFLOW.md` (your role's section only), then check open pull requests and the current task card. Read `docs/DECISIONS.md` and `docs/BUGS.md` only when the task needs them. Claude is the only writer of this file.

**Last updated:** 2026-10-31 · **`main` head when written:** `e1884ba` (last app-code commit: `b7c3cc0`) · **Last card number used:** 038

## Goal

One local-first roleplay workbench for authoring, organizing, validating and testing character cards, lorebooks and presets, without silent data loss between formats. Plan goal: a creator never loses a card, never silently breaks it, and can find and fix problems without paying for AI. Details: `docs/PRODUCT_VISION.md`.

## Stack and structure

- React 19, Vite 6, TypeScript, Tailwind 4, Zustand 5, Dexie (IndexedDB), Zod, `gpt-tokenizer`, vitest. Deployed on Vercel as a PWA.
- `src/`: `components`, `constants`, `db`, `hooks`, `io` (formats), `routing` (hash routes), `schemas`, `services` (AI providers), `store` (slices), `types`, `utils`.
- `docs/`: `AI_WORKFLOW.md` (rules and roles), `DECISIONS.md` (numbered decisions, infrastructure facts), `BUGS.md` (verified bugs and risks), `tasks/` (open task cards), `ROADMAP.md` (priority plan), `ARCHITECTURE.md`, `AUTOMATION.md`, `research/` (verified findings, no decisions), `PLATFORM_SUPPORT.md`, `TESTING_STRATEGY.md`, `UI_UX_REDESIGN_SPEC.md`, `PRODUCT_VISION.md`.
- Scripts: `npm run lint && npm test && npm run build`. UI audit: `scripts/ui-audit.py`. Smoke test: `scripts/smoke.py` (Python Playwright, run by hand against `vite preview`, usage in its docstring; not in CI; 16 checks: load, import, open, edit-save with reload, 7 screens, JSON export, desktop load/import/open, no runtime errors). It finds its fields by visible text and placeholder wording, so a reworded placeholder can break a check.
- CI is one job, `test-and-lint`, on pull requests to `main` and on non-docs pushes to `main`. Ruleset `main-ci-gate` targets `main`. Vercel project `roleplayforge` deploys production from `main` only. Details, ids and the recovery steps: `docs/DECISIONS.md`, "Infrastructure facts" and Decisions 19, 22.
- Mockups (phone Studio, Review sheet, desktop 3-pane) are reference only and not in the repo.

## Current task

Two cards are written, both `Review: skip`, independent (different files), so Muse can run them in either order. Muse is the default executor; ChatGPT is the fallback and works only when the owner names it (Decision 33). Small UI changes go through the `tweak:` lane (Decision 32, `docs/AI_WORKFLOW.md` Fast lane).

1. **Owner, next:** tell Muse `Execute docs/tasks/037-saved-indicator.md` and `Execute docs/tasks/038-wording-fixes.md`.
   - Card 037: the ContextBar save indicator reads "Saved" (green dot) when nothing is pending, instead of "Unsaved" two seconds after a save (ROADMAP 6b). Two files: `src/components/ContextBar.tsx` and its test. Muse first checks that no code changes the active card without saving; if one exists it stops.
   - Card 038 (batch of two): the Guide drops the unproven "Agnaistic" claim; the backup export dialog title reads "Export Backup (no API keys)" when "Include API keys" is unticked.
   - When they merge, Claude removes the matching entries from `docs/BUGS.md` at `sync`.
2. After that, the owner picks from `docs/ROADMAP.md` and `docs/BUGS.md`: lorebook budget order, the export picker in Details "Cover art and export", whose placeholder "Export Card As..." shows as a selectable first row on the owner's phone (seen in one screenshot 2026-10-31, code not read; `tweak:` or `small fix:` candidate), restore skipping lorebooks and profiles without a `uuid` silently (BUGS, rare), linter 022, receipts 023 (an export preview of what is kept, converted or dropped is the idea with the most value for card builders), lorebook budget and size 024, syntax ribbon 025, the small paste warning for two fenced blocks, the optional AI "Smart fill" (Decision 25), a Backup and Restore round trip in `scripts/smoke.py` (`Review: skip`, one file; do it before anyone touches restore code), and wiring the smoke test into CI (its own `Review: required` card, slows every PR; not decided). Argon's strategy ideas are verified in `docs/research/002-argon-strategy-verification.md`; none is carded. Muse's two runs of the smoke test passed all 16 checks with no app findings (Muse's report; Claude has not run it).

Owner phone checks passed (2026-10-31): 028, 031, 032, 033, tweak #33 (Details "Cover art and export" shows "Preview poster" and one heading, poster preview opens; no style picker, Assist without a cover button, uploaded cover still shows in Library), 034 and 035 (Settings has no "Device Clone & P2P Sync" section, Backup & Restore works, no camera prompt anywhere; the Import chooser with a "Camera" shortcut is Android's own file picker, not a page permission). Pending, and not a merge gate (Decision 17): 001-019, 027 and 029, 030. Task 021 is untested on a real SillyTavern file. Deviation from the quick-wins batch: "12px minimum text" is not in cards 001-007 (about 266 uses of `text-[9px]`, `text-[10px]`, `text-[11px]` in 36 files); do it per screen.

## In progress

No open pull requests. Cards 037 and 038 are written and not started.

## Done

Squash-merged pull requests are the changelog (PR #3 to #23 = cards 001-021; PR #24 = card 029; PR #25 = card 026; PR #26 = card 027; PR #27 = card 030; PR #28 = card 028; PR #29 = card 031; PR #30 = card 032; PR #31 = card 033, merge `8215e08`; PR #32 = card 034, merge `b2f1afe`; PR #33 = tweak, merge `e077697`; PR #34 = card 035, merge `b7c3cc0`, camera permission removed from `vercel.json` and `public/_headers`, approved by Claude on head `a612943`; PR #35 = card 036, merge `bfef563`, adds `scripts/smoke.py` only, `test-and-lint` green; cards 033, 034, 035 and 036 and tweak #33 executed by Muse, which passed its trial and is now the default executor). Direct commits by Claude (Decision 23): `7e22276`, `768c784`, `e7aefc4`, `f93096d` (PWA install toast and welcome, new Forge logo with real maskable icon source and splash color, themed emerald/red/cyan/purple in `src/status-colors.css`, invisible Replace-recovery-key button, PwaSection branding; CI green on a clean checkout: lint, 165 tests, build). Docs-only commits: `a61c7cb` (`README.md` device sync line and `docs/ARCHITECTURE.md` after card 034, with the owner's yes), the restore check of 2026-10-31 (cards and lorebooks do go through the Dexie hooks on restore; the earlier "no schema check" note in `docs/ARCHITECTURE.md` was wrong, `backup.ts` calls `validateBackupData`; skipped-without-notice cases logged in `docs/BUGS.md`), and `97c7055` (Decision 33: Muse default executor, ChatGPT kept as fallback, `docs/AI_WORKFLOW.md` updated on the owner's instruction, card 036 written). Merged `tweak:` pull requests are listed here at `sync`: #33 ("Preview Card" renamed "Preview poster", doubled heading removed in Details "Cover art and export"; 1 file `src/components/EditorView.tsx`, 3 changed lines, no limit broken per Claude's diff check). No other tweak has merged.

## Next steps

See `docs/ROADMAP.md` (phone usability, data safety, fixtures and receipts, free tools, privacy-first AI assist, Test Lab, presets).

## Guardrails

- Do not change DB name `CardCrucibleDB`, settings keys, `enc.v1.` format or passkey identifiers. Frozen identifiers (never suggest renaming; all seen in `src/` on 2026-10-30): IndexedDB `CardCrucibleDB` and its tables; API key prefix `enc.v1.`; setting keys `app_theme`, `editor_history_<uuid>`, `assistant_chats`, `cost_tracker_usage`, `crypto_*`, `passkey_*`; the CCv3 URI spelling `embeded://` (one d, matches the spec). Decision 31's one exception, the sync data-channel label `cardcrucible-sync`, went with the code when card 034 removed device sync; no sync identifier remains.
- No origin, host or project rename or move (Decision 20). Keep MIT license and CardCrucible attribution.
- The owner's Chub Helper card is a test fixture only; ask before committing it.
- Planned features count as unimplemented until code and evidence exist.
