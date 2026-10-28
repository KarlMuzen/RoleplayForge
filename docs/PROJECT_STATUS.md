# Project Status

**Snapshot date:** 2026-10-28  
**Canonical repository:** [KarlMuzen/RoleplayForge](https://github.com/KarlMuzen/RoleplayForge)  
**Default branch:** `main`  
**Observed main commit:** [`485d5e21439f`](https://github.com/KarlMuzen/RoleplayForge/commit/485d5e21439f3bdf52d581401d01a9d95dadb1e8)

## Repository checkpoint

- The application source is present in the public repository.
- PR #1 (`Update from Owner`) was merged into `main` on 2026-10-28. This differs from the earlier preference to avoid opening a PR; no additional PR is being created for this documentation update.
- GitHub Actions CI for the observed `main` commit completed successfully.
- The current workflow runs dependency installation, lint/type checking and tests. It does not run the production build.
- The project source and app-facing identifiers still include legacy CardCrucible branding. The Roleplay Forge product direction is documented, but a complete code/UI/package metadata rebrand is not yet reflected in this snapshot.

## Confirmed implementation foundation

The repository contains the established CardCrucible-derived features: card gallery/editor and V2/V3 formats; PNG, JSON and CHARX paths; public Chub import; lorebook editing; schema-validated card patches with review; variants and comparison; model-provider configuration; Crucible testing and transcript tools; local browser persistence; backup/restore; optional passphrase encryption for saved API keys; and PWA/device-sync components.

This list records code paths, not a guarantee of complete platform compatibility or a fresh manual validation of every workflow.

## Known verification gaps

1. Add a production build step to CI and verify it passes on `main`.
2. Complete app-facing branding and package/repository metadata migration in a separate, deliberate implementation change.
3. Add and maintain golden fixtures for import/edit/export/re-import and unknown-field preservation.
4. Verify platform-specific lorebook and preset semantics before advertising adapters as supported.
5. Add explicit conversion receipts for transformed, unsupported or dropped data.
6. Make stale/unknown model pricing visible and test its behavior.
7. Perform a release smoke test on current Android Chromium and desktop browsers; retest iOS Safari before making claims about it.

## Guardrails for continued work

- Use `main` in this repository as the current source of truth; verify the branch head before committing.
- Avoid changing application logic when a task asks for documentation-only work.
- Do not change existing IndexedDB keys, encryption formats, passkey identifiers, sync payload identifiers or migration contracts during branding/doc work unless a separate compatibility plan and tests explicitly cover it.
- Keep the original MIT license and CardCrucible attribution.
- Label roadmap items as planned until implementation and evidence exist.
