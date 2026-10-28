# Roadmap

This roadmap is dependency-ordered. Items remain planned until code, tests and compatibility evidence show they are complete.

## Phase 0 — Repository and product boundaries

- [x] Establish `KarlMuzen/RoleplayForge` as the canonical public GitHub repository.
- [x] Merge the initial repository upload into `main` (PR #1 was merged on 2026-10-28).
- [x] Document the unified-workbench direction and conservative platform-support boundary.
- [x] Add `npm run build` to CI and verify a passing production PWA build.
- [x] Implement the first Roleplay Forge visual/identity pass and update package/PWA metadata.
- [ ] Complete the wider screen-by-screen redesign and manually verify it on an installed Android PWA.
- [ ] Audit remaining legacy-facing wording and inherited project metadata while retaining MIT attribution.

## Phase 1 — Trustworthy foundation

- [ ] Establish representative golden fixtures for cards, embedded lorebooks, standalone lorebooks, assets and extension fields.
- [ ] Test import → edit → export → re-import across PNG, JSON and CHARX; compare known fields and preserve unknown fields.
- [ ] Add property-based/fuzz tests for malformed or oversized inputs and user-facing error handling.
- [ ] Review backup/restore, encrypted API-key storage, migration behavior and local data-loss paths.
- [ ] Put source dates beside pricing estimates and make stale/unknown rates visible.
- [ ] Add a release checklist covering tests, build, dependency audit, data migration and installed-PWA smoke tests.

**Exit criteria:** core fixture round trips pass; unsupported fields are preserved or reported; a clean install, build, test and lint pass; known data-loss risks are documented.

## Phase 2 — First verified platform adapters

- [ ] Define canonical, versioned internal models for character cards, lorebooks, assets and presets, including unknown-field retention.
- [ ] Document Character Card V2/V3 format behavior separately from platform-specific behavior.
- [ ] Create a SillyTavern-focused fixture set and validate each supported lorebook/preset field against current authoritative documentation or a test instance.
- [ ] Keep Chub import covered by fixtures and failure-path tests.
- [ ] Add conversion receipts describing preserved, transformed, unsupported and dropped fields.
- [ ] Add adapters only when schemas, fixtures and clear user need are available. RisuAI and other frontends are candidates, not current support promises.

**Exit criteria:** each verified adapter has a documented scope, sample fixtures, automated tests and a last-tested date.

## Phase 3 — Preset Workshop

- [ ] Define a canonical versioned preset schema separate from provider credentials.
- [ ] Import/export supported preset formats with explicit mapping and loss reports.
- [ ] Separate sampling parameters, context limits, prompt templates, provider/model settings and platform-only fields.
- [ ] Add editable preset profiles, comparison and version history.
- [ ] Prevent accidental export of API keys or connection secrets.

**Exit criteria:** presets can be round-tripped without leaking secrets, and cross-platform differences are visible before export.

## Phase 4 — Repeatable Testing Lab

- [ ] Save named scenario suites with expected traits and failure signals.
- [ ] Record card/lorebook/preset versions, provider/model, model revision where available, temperature, context size, sampling settings and date.
- [ ] Compare variants under identical scenarios and flag regressions.
- [ ] Keep transcript evidence behind scores and expose evaluator uncertainty.
- [ ] Add deterministic tests for evaluation rubrics and versioned benchmark fixtures.

**Exit criteria:** a saved run can be inspected and repeated with the same known inputs; score changes link to transcript evidence.

## Phase 5 — Specialist AI workflows

- [ ] Support mode: source-grounded troubleshooting with dated citations and explicit uncertainty.
- [ ] Card Builder: structured field-by-field generation and user-reviewed patches.
- [ ] Lorebook Designer: trigger suggestions, recursion/overlap diagnostics and activation simulations.
- [ ] Preset Coach: explain compatible settings and flag non-portable parameters.
- [ ] Test Analyst: summarize runs, identify regressions and propose evidence-linked patches.

**Exit criteria:** every mode has tests for expected output, uncertainty behavior, common failure cases and regression prevention.

## Deferred until justified

- Cloud accounts, remote backups or shared libraries.
- Marketplace, community publishing or hosted chats.
- An independent Reviewer workflow if Test Analyst quality proves insufficient.
- Broad claims of universal platform compatibility.
