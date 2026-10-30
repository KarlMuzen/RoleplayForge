# PROJECT_STATE

Entry point for any AI or human picking up work. The repo is the source of truth, not chat history. Read this, then `docs/AI_WORKFLOW.md` (your role's section only), then check open pull requests and the current task card. Read `docs/DECISIONS.md` and `docs/BUGS.md` only when the task needs them. Claude is the only writer of this file.

**Last updated:** 2026-10-30 · **`main` head when written:** `38a1545` · **Last card number used:** 029

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

1. **Executor (ChatGPT):** squash-merge PR #24 (`wip/029`, head `f7f140a`, Task 029). Claude's verdict `Approved` for that head is posted as a PR comment (2026-10-30) and `test-and-lint` is green. Transition: PR #24 already edited the card under the old rules, so after the merge delete `docs/tasks/029-png-export-keeps-cover.md` in one docs commit to `main`. Then check the production deployment (Decision 22).
2. **Then, one at a time, same rules:** `026-backup-validation.md`, `027-backup-export-keys-choice.md`, `028-views-use-store-not-db.md` (all `Review: required`). These cards use the old template: ignore their Status, Progress, Result and Review sections, record progress in the PR description, and delete the card in the PR's last commit.
3. **Claude, next:** after 029 to 028, refresh this file and fix the "Reads directly" arrow in `docs/ARCHITECTURE.md`; the workflow picture there is also out of date after v2 (Decision 29). The owner then picks from `docs/ROADMAP.md` and `docs/BUGS.md`: lorebook budget order, "Unsaved" label after save (ROADMAP 6b), cover-generator disclosure, linter 022, receipts 023, lorebook budget and size 024, syntax ribbon 025, the small paste warning for two fenced blocks, and the optional AI "Smart fill" (Decision 25).

Owner phone checks of 001-019 and 029 are pending and are not a merge gate (Decision 17). Task 021 is untested on a real SillyTavern file. Deviation from the quick-wins batch: "12px minimum text" is not in cards 001-007 (about 266 uses of `text-[9px]`, `text-[10px]`, `text-[11px]` in 36 files); do it per screen.

## In progress

See open pull requests (branch `wip/NNN`). Open: PR #24 (Task 029; approved; waits for the executor's merge). Cards 026-028 are committed and not started.

## Done

Squash-merged pull requests are the changelog (PR #3 to #23 = cards 001-021). Direct commits by Claude (Decision 23): `7e22276`, `768c784`, `e7aefc4`, `f93096d` (PWA install toast and welcome, new Forge logo with real maskable icon source and splash color, themed emerald/red/cyan/purple in `src/status-colors.css`, invisible Replace-recovery-key button, PwaSection branding; CI green on a clean checkout: lint, 165 tests, build).

## Next steps

See `docs/ROADMAP.md` (phone usability, data safety, fixtures and receipts, free tools, privacy-first AI assist, Test Lab, presets).

## Guardrails

- Do not change DB name `CardCrucibleDB`, settings keys, `enc.v1.` format, passkey or sync identifiers. Frozen identifiers (never suggest renaming; all seen in `src/` on 2026-10-30): IndexedDB `CardCrucibleDB` and its tables; API key prefix `enc.v1.`; setting keys `app_theme`, `editor_history_<uuid>`, `assistant_chats`, `cost_tracker_usage`, `crypto_*`, `passkey_*`; the CCv3 URI spelling `embeded://` (one d, matches the spec).
- No origin, host or project rename or move (Decision 20). Keep MIT license and CardCrucible attribution.
- The owner's Chub Helper card is a test fixture only; ask before committing it.
- Planned features count as unimplemented until code and evidence exist.
