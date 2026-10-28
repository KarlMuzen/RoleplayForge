# Project Status

**Snapshot date:** 2026-10-28  
**Canonical repository:** [KarlMuzen/RoleplayForge](https://github.com/KarlMuzen/RoleplayForge)  
**Default branch:** `main`  
**Observed UI implementation commit:** [`f5da42931a76`](https://github.com/KarlMuzen/RoleplayForge/commit/f5da42931a7624aa11c01042a520fed3d1075209)  
**Verified CI run:** [`40745488947`](https://github.com/KarlMuzen/RoleplayForge/actions/runs/40745488947)

## Repository checkpoint

- The application source is present in the public repository and `main` is the source of truth.
- PR #1 (`Update from Owner`) was merged into `main` on 2026-10-28. Follow-up changes are being pushed directly to `main` without opening PRs.
- The current CI workflow successfully runs dependency installation, lint/type checking, automated tests and a production PWA build.
- The first review-driven Roleplay Forge UI pass is in place: warm parchment/charcoal theme, early theme bootstrap, app and package identity, PWA manifest/icon generation, labeled mobile navigation, contextual help, reduced-motion/accessibility refinements, and Library/AI patch-review improvements.
- The app remains CardCrucible-derived. The deeper screen-by-screen redesign and manual installed-PWA validation are not complete.

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
