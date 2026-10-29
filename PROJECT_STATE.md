# PROJECT_STATE

Entry point for any AI or human picking up work. The repo is the source of truth, not chat history. Read this, then `docs/AI_WORKFLOW.md`, then check open pull requests and the current task card, then `docs/HANDOFF.md` and `docs/ROADMAP.md` if needed. Claude is the only writer of this file.

**Last updated:** 2026-10-29 · **`main` head when written:** `a34db5e`

## Goal

One local-first roleplay workbench for authoring, organizing, validating and testing character cards, lorebooks and presets, without silent data loss between formats. Plan goal: a creator never loses a card, never silently breaks it, and can find and fix problems without paying for AI. Details: `docs/PRODUCT_VISION.md`.

## Stack and structure

- React 19, Vite 6, TypeScript, Tailwind 4, Zustand 5, Dexie (IndexedDB), Zod, `gpt-tokenizer`, vitest. Deployed on Vercel as a PWA.
- `src/`: `components`, `constants`, `db`, `hooks`, `io` (formats), `routing` (hash routes), `schemas`, `services` (AI providers), `store` (slices), `types`, `utils`.
- `docs/`: `AI_WORKFLOW.md` (how the two AIs work), `tasks/` (task cards), `HANDOFF.md` (latest session notes), `ROADMAP.md` (priority plan + phases), `AUTOMATION.md` (what is automated; extras on hold), `PROJECT_STATUS.md`, `PLATFORM_SUPPORT.md`, `TESTING_STRATEGY.md`, `UI_UX_REDESIGN_SPEC.md`, `PRODUCT_VISION.md`.
- Scripts: `npm run lint && npm test && npm run build`. UI audit: `scripts/ui-audit.py`.
- CI: `.github/workflows/ci.yml`, one job `test-and-lint` (lint, tests, build). Runs on pull requests to `main` and on non-docs pushes to `main`. Not on other branches until a pull request exists.
- GitHub ruleset `main-ci-gate` targets `main`. Bypass: repository admin and the Claude GitHub connector (seen in owner screenshot, 2026-10-29).
- Vercel (Hobby plan, 100 deployments per day): production from `main`; `ignoreCommand` skips docs-only commits. Previews for `wip/*` branches are being switched off (Task 011, Decision 19).

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
15. Merges are automatic: required check `test-and-lint` on `main`, auto-merge with squash. Card says `Review: skip`, or Review is Approved, before the executor enables it. The executor gets 2 fix attempts after a red CI, then stops and records the failure in the card.
16. Every place that shows a card cover uses one `CardAvatar` component with an initials fallback (Tasks 002-003).
17. Speed first: set up no new automation or tooling (Dependabot, CodeQL, CI mobile tests, analytics) until the quick-wins cards and the Details reorder are merged. See `docs/AUTOMATION.md`. Owner phone checks are not a merge gate: merge on green CI, the owner checks production later in a batch and reports problems as a new card.
18. Chat is a card test bench, not a chat host (`docs/PRODUCT_VISION.md`). Taken from Chub-style chat, scoped down: one header menu (name, model profile switch, Lorebook Debug, Group Preview, Reset), a multi-line message box, and regenerate/edit/delete on the last message only (Tasks 008-010, in that order; one writer on `ChatPreviewModal.tsx` at a time). Not adopted: secrets, chat memory/summary, saved-chats list, chat tree, discussion thread, slash commands, voice input. Reconsider only with evidence of user demand.
19. The only merge gate is `test-and-lint`. The Vercel status is informational: red, failed or missing never blocks a squash merge, and the executor merges by hand when auto-merge is rejected. Vercel Hobby allows 100 deployments per day; the limit was hit on 2026-10-29 ("retry in 24 hours"), so Vercel deployments for `wip/*` branches are switched off (Task 011). With no previews, the owner checks production after the next successful deploy, in a batch (Decision 17). Source: https://vercel.com/docs/plans/hobby.

Mockups (phone Studio, Review sheet, desktop 3-pane) are reference only and not in the repo.

## Current task

1. **Executor (ChatGPT):** in this order, each after the previous is merged: `docs/tasks/011` (no Vercel deployments for `wip/*`, one file), then Chat cards `009` (multi-line message box) and `010` (regenerate, edit, delete on the last message). All `Review: skip`. 009 and 010 share `ChatPreviewModal.tsx`, so never run two at once. Merge on a green `test-and-lint` only (Decision 19).
2. **Claude, next:** card 012 (Task 008 follow-ups, see Known bugs), written after 010 is merged because it touches `ChatPreviewModal.tsx`. Then plan HANDOFF step 3 (Details reorder) as task cards. No Dependabot card for now.

Cards 001-008 are merged (quick wins, CardAvatar, rating-filter and Assist/Chat layout, Chat header menu). Owner phone check of 001-008 is pending and is not a merge gate (Decision 17).

HANDOFF step 2 deviation: "12px minimum text" is not in these cards. There are about 266 uses of `text-[9px]`, `text-[10px]` and `text-[11px]` in 36 files, too big for one card. Step 3 rewrites the Details components anyway, so do it per screen after step 3, not before.

Verify `main` head first.

## In progress

See open pull requests (branch `wip/NNN`). None known.

## Done

See squash-merged pull requests on `main`. Merged: PR #3 (001) to #10 (008). Earlier docs commits: `7cbd503` plan and this file, `484e6b4` AI workflow, `0537d84` pull-request gate, `cfad9f5` single writer + auto-merge gate, `9f33f96` automation audit, `792be51` cards 001-006.

## Next steps (see `docs/ROADMAP.md` for the full checklists)

1. Phone usability (HANDOFF steps 2-6, plus status chip, keyboard mode, full-screen field editor, `variants` route).
2. Data safety: persistent storage request, backup age and reminder.
3. Fixtures and conversion receipts.
4. Free tools: token function, card linter, lorebook activation simulator (verify SillyTavern rules first).
5. Privacy-first AI assist, then `Change`/`apply`.
6. Test Lab upgrade.
7. Presets, narrow first.

## Known bugs and risks

- Details first screen shows no writing fields; token header wraps on real cards.
- Chat: typing in the name box used to erase the conversation; fixed in Task 008 (merged), not yet checked on a phone.
- Task 008 follow-ups, seen in the diff and not run: (a) the Group Preview count badge is `absolute` inside a row with no `relative`, so it likely lands on the menu's top-right corner; (b) the name box commits on blur or Enter only, and tapping outside may close the menu before it commits, leaving the box and the chat with different names; (c) an extra "Select profile..." option (not in the card) clears the active profile. Card 012 after 010.
- Chat: `**bold**` shows stray asterisks (`renderRoleplayText` only handles `*action*`). Not carded.
- Vercel Hobby deployment limit was hit on 2026-10-29 (about 08:21 UTC; "retry in 24 hours"). Production likely does not update until it resets. The next code merge to `main` after the reset should deploy everything merged meanwhile; docs-only pushes do not deploy. Unverified: whether canceled docs-only deployments count toward the 100, and whether upgrading to Pro (6,000 per day) lifts an active limit at once. Task 011 stops `wip/*` deployments.
- Auto-merge is rejected by GitHub on most pull requests (#4-#10). #10 showed `unstable` only because of the Vercel rate limit; the executor merges by hand once `test-and-lint` is green. Owner to check Settings, General, Pull Requests, "Allow auto-merge".
- Tasks 001-008 are verified by CI only; owner phone check pending. Tasks 005-006 (accessible names) are not visible by eye; the UI audit could not be run by the executor.
- Lorebook delete: not verified whether it confirms.
- `usePWAUpdate` may fail on an undefined registration (seen when service workers are blocked; verify before changing).
- `selectCardForEditing` does not flush pending autosave on the Library tap path (D-13).
- Accessibility: light theme has more contrast failures than dark. 5 unlabelled selects (Task 005 merged), 3 unnamed buttons (Task 006 merged); unverified until the UI audit runs.
- CI skips docs-only pushes, so the required check cannot report on them. Docs pushes to `main` work only through the ruleset bypass. The ChatGPT connector was not seen on the bypass list; it uses pull requests.
- `docs/PROJECT_STATUS.md` header still names `13d4442` as the checkpoint; `main` is later. Refresh when next touched.
- Unverified: Vercel runtime headers/CSP in production, Android installed-PWA behavior, iOS Safari, passkey flow on phone, Ollama on `localhost:11434` from https.
- Adapters and simulators depend on SillyTavern/Chub behavior that can change; each needs a last-tested date.

## Guardrails

- Verify the `main` head before every direct commit and before creating a branch.
- Read the repo with `git clone`. github.com pages fetched through a web tool can be stale or blocked.
- Do not change DB name `CardCrucibleDB`, settings keys, `enc.v1.` format, passkey or sync identifiers.
- No origin or project rename. Keep MIT license and CardCrucible attribution.
- The owner's Chub Helper card is a test fixture only; ask before committing it.
- Planned features count as unimplemented until code and evidence exist.

## Handoff

On "handoff", update the task card's Progress (Claude: the Current task above), then give a paste block of at most 10 lines: goal, current task, open pull request if any, next action. A new chat starts with the bootstrap line in `docs/AI_WORKFLOW.md`.
