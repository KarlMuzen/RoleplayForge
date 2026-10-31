# PROJECT_STATE

Entry point for any AI or human picking up work. The repo is the source of truth, not chat history. Read this, then `docs/AI_WORKFLOW.md` (your role's section only), then check open pull requests and the current task card. Read `docs/DECISIONS.md` and `docs/BUGS.md` only when the task needs them. Claude is the only writer of this file.

**Last updated:** 2026-10-31 · **`main` head when written:** `b2f1afe` (last code commit: `b2f1afe`) · **Last card number used:** 034

## Goal

One local-first roleplay workbench for authoring, organizing, validating and testing character cards, lorebooks and presets, without silent data loss between formats. Plan goal: a creator never loses a card, never silently breaks it, and can find and fix problems without paying for AI. Details: `docs/PRODUCT_VISION.md`.

## Stack and structure

- React 19, Vite 6, TypeScript, Tailwind 4, Zustand 5, Dexie (IndexedDB), Zod, `gpt-tokenizer`, vitest. Deployed on Vercel as a PWA.
- `src/`: `components`, `constants`, `db`, `hooks`, `io` (formats), `routing` (hash routes), `schemas`, `services` (AI providers), `store` (slices), `types`, `utils`.
- `docs/`: `AI_WORKFLOW.md` (rules and roles), `DECISIONS.md` (numbered decisions, infrastructure facts), `BUGS.md` (verified bugs and risks), `tasks/` (open task cards), `ROADMAP.md` (priority plan), `ARCHITECTURE.md`, `AUTOMATION.md`, `research/` (verified findings, no decisions), `PLATFORM_SUPPORT.md`, `TESTING_STRATEGY.md`, `UI_UX_REDESIGN_SPEC.md`, `PRODUCT_VISION.md`.
- Scripts: `npm run lint && npm test && npm run build`. UI audit: `scripts/ui-audit.py`.
- CI is one job, `test-and-lint`, on pull requests to `main` and on non-docs pushes to `main`. Ruleset `main-ci-gate` targets `main`. Vercel project `roleplayforge` deploys production from `main` only. Details, ids and the recovery steps: `docs/DECISIONS.md`, "Infrastructure facts" and Decisions 19, 22.
- Mockups (phone Studio, Review sheet, desktop 3-pane) are reference only and not in the repo.

## Current task

No card is open. Small UI changes now go through the `tweak:` lane (Decision 32, `docs/AI_WORKFLOW.md` Fast lane): the owner tells Muse or ChatGPT directly, no card and no Claude review.

1. **Owner, next:** first `tweak:` candidates: rename "Preview Card" to "Preview poster"; remove the doubled heading in Details "Cover art and export" ("Cover art and export" followed by "Character Cover & Visual Card Export"). Muse passed its trial on card 033; making it the default executor is the owner's call.
2. **Claude, next (needs the owner's yes before any file change):** update `README.md` (the "device-to-device sync" line) and `docs/ARCHITECTURE.md` (the sync part, the "Reads directly" arrow, which is stale after 028 and 026, and the workflow picture, stale after v2, Decision 29), because card 034 has merged. Open question for the owner: `public/_headers` still allows `camera=(self)`, which only the sync QR scanner used.
3. The owner then picks from `docs/ROADMAP.md` and `docs/BUGS.md`: lorebook budget order, "Unsaved" label after save (ROADMAP 6b), the Guide's Agnaistic claim (`small fix:` candidate), the export dialog title wording (`small fix:` candidate), linter 022, receipts 023 (an export preview of what is kept, converted or dropped is the idea with the most value for card builders), lorebook budget and size 024, syntax ribbon 025, the small paste warning for two fenced blocks, and the optional AI "Smart fill" (Decision 25). Argon's strategy ideas are verified in `docs/research/002-argon-strategy-verification.md`; none is carded.

Owner phone checks passed (2026-10-31): 028, 031, 032 and 033 (Details "Cover art and export" without a style picker, Assist without a cover button, uploaded cover still shows in Library). Pending, and not a merge gate (Decision 17): 001-019, 027, 029, 030 and 034 (Settings has no "Device Clone & P2P Sync" section, Backup & Restore export and import still work, no camera prompt). Task 021 is untested on a real SillyTavern file. Deviation from the quick-wins batch: "12px minimum text" is not in cards 001-007 (about 266 uses of `text-[9px]`, `text-[10px]`, `text-[11px]` in 36 files); do it per screen.

## In progress

No open pull requests and no open card.

## Done

Squash-merged pull requests are the changelog (PR #3 to #23 = cards 001-021; PR #24 = card 029; PR #25 = card 026; PR #26 = card 027; PR #27 = card 030; PR #28 = card 028; PR #29 = card 031; PR #30 = card 032; PR #31 = card 033, merge `8215e08`; PR #32 = card 034, merge `b2f1afe`; cards 033 and 034 executed by Muse, which passed its trial). Direct commits by Claude (Decision 23): `7e22276`, `768c784`, `e7aefc4`, `f93096d` (PWA install toast and welcome, new Forge logo with real maskable icon source and splash color, themed emerald/red/cyan/purple in `src/status-colors.css`, invisible Replace-recovery-key button, PwaSection branding; CI green on a clean checkout: lint, 165 tests, build). Merged `tweak:` pull requests are listed here at `sync`: none yet.

## Next steps

See `docs/ROADMAP.md` (phone usability, data safety, fixtures and receipts, free tools, privacy-first AI assist, Test Lab, presets).

## Guardrails

- Do not change DB name `CardCrucibleDB`, settings keys, `enc.v1.` format or passkey identifiers. Frozen identifiers (never suggest renaming; all seen in `src/` on 2026-10-30): IndexedDB `CardCrucibleDB` and its tables; API key prefix `enc.v1.`; setting keys `app_theme`, `editor_history_<uuid>`, `assistant_chats`, `cost_tracker_usage`, `crypto_*`, `passkey_*`; the CCv3 URI spelling `embeded://` (one d, matches the spec). Decision 31's one exception, the sync data-channel label `cardcrucible-sync`, went with the code when card 034 removed device sync; no sync identifier remains.
- No origin, host or project rename or move (Decision 20). Keep MIT license and CardCrucible attribution.
- The owner's Chub Helper card is a test fixture only; ask before committing it.
- Planned features count as unimplemented until code and evidence exist.
