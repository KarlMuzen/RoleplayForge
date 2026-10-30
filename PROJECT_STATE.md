# PROJECT_STATE

Entry point for any AI or human picking up work. The repo is the source of truth, not chat history. Read this, then `docs/AI_WORKFLOW.md`, then check open pull requests and the current task card, then `docs/HANDOFF.md` and `docs/ROADMAP.md` if needed. Claude is the only writer of this file.

**Last updated:** 2026-10-30 · **`main` head when written:** `f4d4310`

## Goal

One local-first roleplay workbench for authoring, organizing, validating and testing character cards, lorebooks and presets, without silent data loss between formats. Plan goal: a creator never loses a card, never silently breaks it, and can find and fix problems without paying for AI. Details: `docs/PRODUCT_VISION.md`.

## Stack and structure

- React 19, Vite 6, TypeScript, Tailwind 4, Zustand 5, Dexie (IndexedDB), Zod, `gpt-tokenizer`, vitest. Deployed on Vercel as a PWA.
- `src/`: `components`, `constants`, `db`, `hooks`, `io` (formats), `routing` (hash routes), `schemas`, `services` (AI providers), `store` (slices), `types`, `utils`.
- `docs/`: `AI_WORKFLOW.md` (how the two AIs work), `tasks/` (task cards), `HANDOFF.md` (latest session notes), `ROADMAP.md` (priority plan + phases), `ARCHITECTURE.md` (app layers, data safety and delivery diagrams), `AUTOMATION.md` (what is automated; extras on hold), `research/` (verified findings from source, no decisions), `PLATFORM_SUPPORT.md`, `TESTING_STRATEGY.md`, `UI_UX_REDESIGN_SPEC.md`, `PRODUCT_VISION.md`.
- Scripts: `npm run lint && npm test && npm run build`. UI audit: `scripts/ui-audit.py`.
- CI: `.github/workflows/ci.yml`, one job `test-and-lint` (lint, tests, build). Runs on pull requests to `main` and on non-docs pushes to `main`. Not on other branches until a pull request exists.
- GitHub ruleset `main-ci-gate` targets `main`. Bypass: repository admin and the Claude GitHub connector (seen in owner screenshot, 2026-10-29).
- Vercel (team `xiorolab`, project `roleplayforge`, id `prj_vTfhxB0i0hmxZI1uCnRooJ73745P` since the project was recreated on 2026-10-29; the old id `prj_K3E6…` returns 404 and its deployment history is gone; Hobby plan, 100 deployments per day): production from `main` at `roleplayforge.vercel.app` (the only domain). `ignoreCommand` skips docs-only commits. Deployments for `wip/*` branches are switched off (Task 011, merged `7ad5605`, Decision 19). On 2026-10-29 production was brought up to `c19deac` (Task 015) by a manual deploy through the Vercel connector (see Decision 22).

## Decisions

1. Evolve the existing code. No rewrite. No folder reshuffle into `core/features/ports/adapters`. No Clock/FileIO ports.
2. New pure logic goes in `src/core/` (tokens, linter, activation simulator, receipts, changes). Existing files are not moved. Big views are split only when being edited anyway.
3. `Change`/`apply` (multi-step undo) comes after fixture round-trip tests exist. First use: AI patches and undo only. Single-step undo stays until then.
4. Conversion/import receipts are pulled forward from the HANDOFF "Defer" list into Priority 3.
5. Routes stay `#/forge`, `#/test`, `#/settings`. Add a `variants` sub-route. Renamed sections keep old routes as aliases. The mockup names Studio/Tools are not adopted until Tools has content.
6. Phone layout: one top bar (back, name, status chip, undo/redo), tab strip, bottom nav, nothing else fixed. One Status sheet merges tokens and issues. Keyboard-open mode hides bottom nav. Long fields edit full-screen.
7. AI assist is a per-field button plus one whole-card entry. Every request shows "Sent to <provider>: <fields>". Per-field review stays; per-hunk stays deferred.
8. Wording: worst-case lore is "could exceed", not "over limit". Empty optional fields are info-only and not counted in the issue badge.
9. Token numbers come from one function. Counts are `gpt-tokenizer` estimates and are labelled so. The breakdown must sum to the headline.
10. A revisions store, if added, is additive and capped (about 20 per card). No migration rewrites existing stores.
11. Still deferred: semantic token layer, tablet rail, standalone lorebook shelf, Enhancer move, per-hunk selection.
12. Two-AI workflow: Claude plans and reviews, ChatGPT executes. Hand-offs go through the repo (task cards in `docs/tasks/`), never through pasted chat. Rules in `docs/AI_WORKFLOW.md`.
13. Code changes by the executor go on branch `wip/NNN` with a pull request to `main`, and merge only when CI is green. Docs-only changes may go straight to `main`. This replaces the earlier practice of pushing code directly to `main`, because CI only runs after a direct push.
14. Claude is the only writer of this file. The executor writes code and its own task card. Status comes from pull requests: open = in progress, squash-merged = done. This supersedes the section split in the first version of `AI_WORKFLOW.md`.
15. Superseded by Decision 27 (merge mechanics are in `docs/AI_WORKFLOW.md`).
16. Every place that shows a card cover uses one `CardAvatar` component with an initials fallback (Tasks 002-003).
17. Speed first: set up no new automation or tooling (Dependabot, CodeQL, CI mobile tests, analytics) until the quick-wins cards and the Details reorder are merged. See `docs/AUTOMATION.md`. Owner phone checks are not a merge gate: merge on green CI, the owner checks production later in a batch and reports problems as a new card.
18. Chat is a card test bench, not a chat host (`docs/PRODUCT_VISION.md`). Taken from Chub-style chat, scoped down: one header menu (name, model profile switch, Lorebook Debug, Group Preview, Reset), a multi-line message box, and regenerate/edit/delete on the last message only (Tasks 008-010, merged). Not adopted: secrets, chat memory/summary, saved-chats list, chat tree, discussion thread, slash commands, voice input. Reconsider only with evidence of user demand.
19. The only merge gate is `test-and-lint`. The Vercel status is informational: red, failed or missing never blocks a squash merge, and the executor merges by hand when auto-merge is rejected. Vercel Hobby allows 100 deployments per day; on 2026-10-29 the preview of `wip/008` was rejected ("retry in 24 hours"), so Vercel deployments for `wip/*` branches are switched off (Task 011). With no previews, the owner checks production in a batch (Decision 17). Source: https://vercel.com/docs/plans/hobby.
20. No host or origin move for production. The app stores cards in IndexedDB and passkeys use the hostname as WebAuthn relying-party id (`src/utils/passkeyCrypto.ts`), so a new domain starts empty and old passkeys stop working. A move needs a tested backup/restore path first. A second host used only for testing (separate origin, separate data) is allowed; the repo already has `wrangler.toml` and `public/_headers` for Cloudflare Pages, not verified as working.
21. Details tab order (HANDOFF step 3, spec UX-DET-1): toolbar (Save, Undo, Redo, Variant), one compact token + health row, then Identity (name, description, personality, scenario), Greetings, Lorebook summary, Advanced prompts, Card Info (creator, version, nickname, tags), and last one collapsed "Cover art and export". Cards 013-015, in that order, because they share `EditorView.tsx`. The export sheet and History sheet (UX-DET-2) come with the ContextBar, not now. Task 018 later moves Undo and Redo out of this toolbar into the ContextBar (Decision 24).
22. Vercel deploys only for code commits on `main` (Task 016 closes the last gap with an ignore command that skips any other branch). Project name stays `roleplayforge` (Decision 20). Vercel sometimes never starts a build for a `main` push (no record at all for 010, 011, 014, 015 on 2026-10-29; usage meters were far below limits, so the cause is unknown). Recovery: with the Vercel connector, `create_deployment` for project `roleplayforge`, target `production`, `gitSource` `{type: github, org: KarlMuzen, repo: RoleplayForge, ref: main, sha: <latest CODE commit>}`. Use a code commit, not the docs commit on top of it: a docs-only head is skipped by `ignoreCommand`. Check afterwards that the alias `roleplayforge.vercel.app` points to the new deployment.
23. Small owner-requested fixes (PWA install toast, logo and icon masking, theme contrast) were committed by Claude directly to `main` on 2026-10-29 (`7e22276`, `768c784`, `e7aefc4`, `f93096d`), before cards 012-015. This is an exception to Decision 13 on the owner's instruction; the executor still uses `wip/NNN` pull requests. Any further direct code commit by Claude needs the owner's instruction and a line here. Superseded by Decision 27: the standing minor-commit rule in `docs/AI_WORKFLOW.md`.
24. ContextBar (HANDOFF step 4, spec 4.4): one component for Forge and Test, two rows, replaces `WorkspaceSubNav` and `LabSubNav` (Task 017). Undo, Redo and a save-status chip live in it on Forge tabs only (Task 018). The Save Card and Variant buttons stay on the Details toolbar until the overflow-menu card. Card switcher sheet and overflow menu are later cards.
25. Paste-to-card (Task 020): a paste box in the Library Import menu reads raw card JSON, unknown JSON and labeled text with fixed rules, no AI and no network, and shows what it understood before creating. Unmatched data is appended to Description, never dropped. AI reading of messy prose is a separate later card and must show "Sent to <provider>" (Decision 7).
26. Outside research is not a source. A claim from another AI's export or a blog enters the repo only after Claude verifies it in code or in the primary source (`docs/research/`). Rejected claims are listed in `docs/research/001-st-spec-verification.md` (cross-check section) so they are not re-proposed. On 2026-10-30 `AI_CHANGELOG.md` (stale AI Studio log) and `docs/PROJECT_STATUS.md` (stale snapshot) were removed; git history keeps them. `CHANGELOG.md` is stale (describes the 2026-10-28 theme and mark) and was left; squash-merged PR titles are the changelog. Lean-repo rules are in `docs/AI_WORKFLOW.md`.
27. The Claude/ChatGPT workflow is final and lives only in `docs/AI_WORKFLOW.md`. It changes only when the owner says "change workflow". It supersedes Decisions 12-15 and the auto-merge parts of 19 and 23: no auto-merge, the executor squash-merges by hand after green `test-and-lint` (and Approved when the card says `Review: required`); Claude may make minor direct code commits only under the limits in that file. `PROJECT_STATE.md` keeps product decisions and state; it never restates process.

Mockups (phone Studio, Review sheet, desktop 3-pane) are reference only and not in the repo.

## Current task

None carded. Card 021 is merged (PR #23, `b3d45d6`, production READY). Next, in order (`docs/ROADMAP.md`, "Next cards"): 022 linter additions (includes the three Chub Helper findings), 023 conversion receipts, 024 lorebook budget and size, 025 syntax ribbon, then the Details accuracy card. The owner says which to write next. Optional AI "Smart fill" for messy prose stays with the owner (Decision 25).

Cards 001-021 are merged (021 = ST standalone lorebook import, PR #23; 020 = paste-to-card, PR #22). Owner phone check of 001-019 is pending and is not a merge gate. Owner reported 2026-10-30 that paste-to-card works; 021 is untested on a real SillyTavern file and on the Lorebook screen alert.

HANDOFF step 2 deviation: "12px minimum text" is not in these cards. There are about 266 uses of `text-[9px]`, `text-[10px]` and `text-[11px]` in 36 files, too big for one card. Do it per screen.

## In progress

See open pull requests (branch `wip/NNN`). None open (checked 2026-10-30, `main` head `f4d4310`).

## Done

See squash-merged pull requests on `main`. Merged: PR #3 (001) to #10 (008), #11 (011), #12 (009), #13 (010), #14 (012), #15 (013), #16 (014), #17 (015), then 016-021 (019 is PR #21, 020 is PR #22 `c0db92c`, 021 is PR #23 `b3d45d6`). Direct commits by Claude (Decision 23): `7e22276`, `768c784`, `e7aefc4`, `f93096d` (PWA install toast and welcome, new Forge logo with real maskable icon source and splash color, themed emerald/red/cyan/purple in `src/status-colors.css`, invisible Replace-recovery-key button, PwaSection branding; CI green on a clean checkout: lint, 165 tests, build). Earlier docs commits: `7cbd503` plan and this file, `484e6b4` AI workflow, `0537d84` pull-request gate, `cfad9f5` single writer + auto-merge gate, `9f33f96` automation audit, `792be51` cards 001-006.

## Next steps (see `docs/ROADMAP.md` for the full checklists)

1. Phone usability (HANDOFF steps 2-6, plus status chip, keyboard mode, full-screen field editor, `variants` route).
2. Data safety: persistent storage request, backup age and reminder.
3. Fixtures and conversion receipts.
4. Free tools: token function, card linter, lorebook activation simulator (verify SillyTavern rules first).
5. Privacy-first AI assist, then `Change`/`apply`.
6. Test Lab upgrade.
7. Presets, narrow first.

## Known bugs and risks

- Lorebook import (Task 021, merged, review notes): `LorebookView.handleImportLorebook` wraps `updateLorebook` and `saveActiveCard` in the new try/catch, so a failed save shows "Nothing imported" although the lorebook is applied in memory. In `GalleryView`, a `.zip` that parses as one lorebook sets `importedAsCharx` and skips bulk unpacking. A ZIP holding only lorebooks shows two warnings. Not carded; rare.
- PNG with several card chunks: `pickBestDuplicateCandidate` (`src/io/png.ts`) prefers the chunk with `character_book`, else the longer JSON. SillyTavern and RisuAI read `ccv3` first (research 001, claim 5). Open decision; needs real fixtures. Not carded.
- Lorebook entry list has no paging or virtualization (`LorebookView.tsx`); a book with hundreds of entries may be slow on a phone. Unmeasured; measure with a 600-entry fixture before changing.
- `validateCardCompleteness` (`src/utils/validation.ts`) warns "Personality is missing" for non-Chub cards; Decision 8 says empty optional fields are info-only. Folded into the linter card (022).
- Chat formatting (Task 019, merged): owner phone check pending; `"quoted dialogue"` coloring, underline and tables were left out on purpose.
- Details chip reads "1 alerts" with exactly one warning (wording given in Task 014). Cards 012-015 are verified by CI and code diff only; whether the Details token row stays on one line at 393px is unchecked on a phone.
- Chat tasks 008-010 are verified by CI only; not yet checked on a phone.
- Vercel (checked 2026-10-29): production now serves `c19deac` (Task 015) via manual deploy `dpl_AnKFe27…`, so Tasks 010-015 are live. Vercel never created deployments for the pushes of 010, 011, 014 and 015; 012 and 013 deployed within seconds. Usage meters are far below limits and about 62 deployments were recorded in 24 hours (limit 100), so a rate limit is not shown. A canceled record for the docs commit `bad5b0e` appeared about 25 minutes after its push, which suggests late or dropped push delivery. Cause unverified. Not checkable by Claude: GitHub app repository access (owner: GitHub Settings, Applications, Installed GitHub Apps, Vercel). Task 016 plus a check after each merge covers it.
- Auto-merge is rejected by GitHub on most pull requests (#4-#17) with "Pull request is in clean status". That message means the PR was already mergeable when the executor tried (CI had finished), so it is probably timing, not the repository setting. The executor merges by hand once `test-and-lint` is green. Unverified: Settings, General, Pull Requests, "Allow auto-merge" (owner only).
- Tasks 001-010 are verified by CI only; owner phone check pending. Tasks 005-006 (accessible names) are not visible by eye; the UI audit could not be run by the executor.
- Lorebook delete: not verified whether it confirms.
- `usePWAUpdate` may fail on an undefined registration (seen when service workers are blocked; verify before changing).
- `selectCardForEditing` does not flush pending autosave on the Library tap path (D-13).
- Accessibility: light theme has more contrast failures than dark. 5 unlabelled selects (Task 005 merged), 3 unnamed buttons (Task 006 merged); unverified until the UI audit runs.
- CI skips docs-only pushes, so the required check cannot report on them. Docs pushes to `main` work only through the ruleset bypass. The ChatGPT connector was not seen on the bypass list; it uses pull requests.
- Unverified: Vercel runtime headers/CSP in production, Android installed-PWA behavior, iOS Safari, passkey flow on phone, Ollama on `localhost:11434` from https.
- Adapters and simulators depend on SillyTavern/Chub behavior that can change; each needs a last-tested date.
- Branding leftovers, not fixed: the passkey prompt shows "CardCrucible User" / `cardcrucible_user` (`src/utils/passkeyCrypto.ts`, a frozen identifier area: ask the owner before touching, existing passkeys may be affected); `ErrorBoundary` console and crash-report text, `BackupRestoreSection` file names (`cardcrucible_full_backup_*`), and the OpenRouter header placeholder in `ConnectionProfilesSection` still say CardCrucible.
- Icons: committed `public/*.png` are stale; `npm run build` regenerates them from `public/forge-mark.svg` and `forge-mark-maskable.svg`. Android caches installed icons, so the owner may need to reinstall the PWA to see the new one. Install toast and new splash are unverified on a phone.
- Theme: in a fresh browser context with `roleplay-forge-theme=light` in localStorage the app still came up with the `dark` class (checked locally with Playwright, cause unverified; the app may read the theme from IndexedDB). Light theme contrast is improved by `src/status-colors.css` but not re-audited with `scripts/ui-audit.py`.

## Guardrails

- Verify the `main` head before every direct commit and before creating a branch.
- Read the repo with `git clone`. github.com pages fetched through a web tool can be stale or blocked.
- Do not change DB name `CardCrucibleDB`, settings keys, `enc.v1.` format, passkey or sync identifiers.
- No origin, host or project rename or move (Decision 20). Keep MIT license and CardCrucible attribution.
- The owner's Chub Helper card is a test fixture only; ask before committing it.
- Planned features count as unimplemented until code and evidence exist.

## Handoff

On "handoff", update the task card's Progress (Claude: the Current task above), then give a paste block of at most 10 lines: goal, current task, open pull request if any, next action. A new chat starts with the bootstrap line in `docs/AI_WORKFLOW.md`.
