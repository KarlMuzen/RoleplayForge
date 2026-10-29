# Project Status

**Snapshot date:** 2026-10-29  
**Canonical repository:** [KarlMuzen/RoleplayForge](https://github.com/KarlMuzen/RoleplayForge)  
**Default branch:** `main`  
**Latest verified implementation checkpoint:** [`c19deacf4c10`](https://github.com/KarlMuzen/RoleplayForge/commit/c19deacf4c10fcbfdb4559b6283491a4f59be277) (Task 015, PR #17; `main` head `bad5b0e` is a docs commit on top)  
**Verified CI run:** [`40852384343`](https://github.com/KarlMuzen/RoleplayForge/actions/runs/40852384343)  
**Production:** `roleplayforge.vercel.app` serves `c19deac` (manual deploy on 2026-10-29; see `PROJECT_STATE.md`, Decision 22)

## Repository checkpoint

- The application source is present in the public repository and `main` is the source of truth.
- PR #1 (`Update from Owner`) was merged into `main` on 2026-10-28. Since Decision 13 (see `PROJECT_STATE.md`) code changes go through `wip/NNN` pull requests gated by `test-and-lint`; docs-only changes may go straight to `main`.
- The current CI workflow successfully runs dependency installation, lint/type checking, automated tests and a production PWA build.
- The first review-driven Roleplay Forge UI pass is in place: warm parchment/charcoal theme, early theme bootstrap, app and package identity, PWA manifest/icon generation, labeled mobile navigation, contextual help, reduced-motion/accessibility refinements, and Library/AI patch-review improvements.
- The app remains CardCrucible-derived. The deeper screen-by-screen redesign and manual installed-PWA validation are not complete.
- The screenshot-driven Library/Guide fixes are implemented: readable mobile actions, viewport-safe/dismissible Import and Export menus, separate rating/tag filter rows with larger touch targets, removal of misleading bottom-nav dots, and a non-overlapping sticky Guide close control.
- New API-key protection setup is passkey-first where the WebAuthn PRF path is supported, with a one-time offline recovery key that must be acknowledged as saved. Existing passphrase-encrypted vaults and the `enc.v1.` key format remain supported; passphrase setup remains the fallback.
- A READY Vercel production-target deployment exists for current `main` commit `13d44425413d0239a3e3b2b2f8efc98853806791` (documentation-only follow-up to the verified implementation). Runtime headers/CSP and route fallback remain unverified because the connected Vercel integration cannot read protected page responses.
- P0 correctness work now includes transactional AI patch application, single-step undo with guarded Undo feedback, editor-history cleanup on card deletion, undoable snapshot restore, a touch/keyboard-accessible completeness checklist, corrected API-key encryption/passphrase copy, and invariants/regression tests. See the [UI/UX redesign spec and P0 log](UI_UX_REDESIGN_SPEC.md).
- The current `main` head `13d44425413d0239a3e3b2b2f8efc98853806791` has a READY Vercel production-target deployment. The latest CI run `40767763788` completed successfully. The connected Vercel integration cannot read protected page responses (403 at access-bypass stage); deployed route fallback, response headers/CSP behavior remain unverified. Android installed-PWA smoke testing remains outstanding.

## Confirmed implementation foundation

The repository retains the established features: card gallery/editor and V2/V3 formats; PNG, JSON and CHARX import/export paths; public Chub import; lorebook editing; schema-validated AI card patches with selection-aware review; variants and comparison; model-provider configuration; test and transcript tools; local browser persistence; backup/restore; passphrase encryption for saved API keys; and PWA/device-sync components.

This list records code paths, not a guarantee of complete platform compatibility or fresh manual validation of every workflow.

## Known verification gaps

1. Run a manual installed-PWA smoke test on Android after the next deployment/reinstall: launch, theme switch, Library import/create/edit/export/re-import, Forge navigation, AI patch selection/apply/undo, and backup/restore.
2. Finish visual review of Library, editor information order, Settings information architecture and AI review on a real narrow screen.
3. Add representative golden fixtures for import/edit/export/re-import and unknown-field preservation.
4. Verify platform-specific lorebook and preset semantics before advertising adapters as supported.
5. Add explicit conversion receipts for transformed, unsupported or dropped data.
6. Make stale/unknown model pricing visible and test its behavior.
7. Retest iOS Safari before making claims about it.

## Guardrails for continued work

- Verify the `main` branch head before every direct commit.
- Do not change existing IndexedDB keys, encryption formats, passkey identifiers, sync payload identifiers or migration contracts for visual work.
- Keep the original MIT license and CardCrucible attribution.
- Treat planned features and platform adapters as unimplemented until code and evidence exist.
