# PROJECT_STATE

Entry point for any AI or human picking up work. The repo is the source of truth, not chat history. Read this, then `docs/HANDOFF.md`, then `docs/ROADMAP.md`.

**Last updated:** 2026-10-29 · **`main` head when written:** `f93096d`

## Goal

One local-first roleplay workbench for authoring, organizing, validating and testing character cards, lorebooks and presets, without silent data loss between formats. Plan goal: a creator never loses a card, never silently breaks it, and can find and fix problems without paying for AI. Details: `docs/PRODUCT_VISION.md`.

## Stack and structure

- React 19, Vite 6, TypeScript, Tailwind 4, Zustand 5, Dexie (IndexedDB), Zod, `gpt-tokenizer`, vitest. Deployed on Vercel as a PWA.
- `src/`: `components`, `constants`, `db`, `hooks`, `io` (formats), `routing` (hash routes), `schemas`, `services` (AI providers), `store` (slices), `types`, `utils`.
- `docs/`: `HANDOFF.md` (latest session notes), `ROADMAP.md` (priority plan + phases), `PROJECT_STATUS.md`, `PLATFORM_SUPPORT.md`, `TESTING_STRATEGY.md`, `UI_UX_REDESIGN_SPEC.md`, `PRODUCT_VISION.md`.
- Scripts: `npm run lint && npm test && npm run build`. UI audit: `scripts/ui-audit.py`.

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

Mockups (phone Studio, Review sheet, desktop 3-pane) are reference only and not in the repo.

## Current task

Priority 1, HANDOFF step 2: quick-wins batch. Verify `main` head first.

## Next steps (see `docs/ROADMAP.md` for the full checklists)

1. Phone usability (HANDOFF steps 2-6, plus status chip, keyboard mode, full-screen field editor, `variants` route).
2. Data safety: persistent storage request, backup age and reminder.
3. Fixtures and conversion receipts.
4. Free tools: token function, card linter, lorebook activation simulator (verify SillyTavern rules first).
5. Privacy-first AI assist, then `Change`/`apply`.
6. Test Lab upgrade.
7. Presets, narrow first.

## Known bugs and risks

- Guide close band: empty ~110px band at scroll top, covers content when scrolled (`GuideView.tsx` ~line 183).
- Details first screen shows no writing fields; token header wraps on real cards.
- Broken cover image has no fallback (offline PWA, blocked avatar host).
- `Chat` button shows on Lorebook but not Details.
- Lorebook delete: not verified whether it confirms.
- `usePWAUpdate` may fail on an undefined registration (seen when service workers are blocked; verify before changing).
- `selectCardForEditing` does not flush pending autosave on the Library tap path (D-13).
- Accessibility: light theme has more contrast failures than dark. 5 unlabelled selects, 3 unnamed buttons.
- Unverified: Vercel headers/CSP in production, Android installed-PWA behavior, iOS Safari, passkey flow on phone, Ollama on `localhost:11434` from https.
- Adapters and simulators depend on SillyTavern/Chub behavior that can change; each needs a last-tested date.

## Guardrails

- Verify the `main` head before every direct commit.
- Do not change DB name `CardCrucibleDB`, settings keys, `enc.v1.` format, passkey or sync identifiers.
- No origin or project rename. Keep MIT license and CardCrucible attribution.
- The owner's Chub Helper card is a test fixture only; ask before committing it.
- Planned features count as unimplemented until code and evidence exist.

## Handoff

On "handoff", summarize this file plus the latest `docs/HANDOFF.md` in a short paste-ready block.
