# Testing Strategy

## Current CI boundary

The GitHub Actions workflow in `.github/workflows/ci.yml` runs these checks on pushes and pull requests targeting `main`:

```bash
npm ci
npm run lint
npm test
npm run build
```

`npm run lint` includes TypeScript checking and ESLint. CI runs the production PWA build after the tests pass. Check the latest [GitHub Actions run](https://github.com/KarlMuzen/RoleplayForge/actions) for the status of the current commit; do not infer current status from an earlier run.

Run the same checks locally before tagging a release:

```bash
npm ci
npm run lint
npm test
npm run build
```

## Data integrity suite

- PNG/JSON/CHARX import → edit → export → re-import round trips.
- Stable fields, embedded lorebooks, portraits/assets, tags, metadata and extension payloads.
- Unknown-field retention across edits and conversion.
- Backup/restore, undo/redo, variants and database migration scenarios.
- Secret redaction in backup exports; no API-key leakage into logs, reports, fixtures or card exports.
- Malformed and oversized input handling, archive traversal protection and clean error reporting.

## AI behavior suite

Each specialist mode needs a small versioned evaluation set with expected output shape, uncertainty behavior and common failure cases. AI patch tests must verify schema validation, preview behavior, selective application, rejection of malformed patches and undo/redo integration.

## Test Lab reproducibility

A run record should include card and lorebook version/hash, preset version/hash when available, platform profile, provider/model identifier, scenario and seed if supported, sampling settings, context limit, prompt/token estimates, evaluator version, timestamp and transcript. Missing metadata must be explicit.

Compare outputs using automated metrics and transcript evidence. A single LLM judge score is not ground truth; use versioned rubrics, fixed examples and human review for high-impact conclusions.

## Manual release smoke test

- Load the app on a narrow mobile viewport and desktop.
- Import known V2 PNG, V3 PNG, JSON and CHARX fixtures.
- Edit a card field and lorebook entry; export and verify the result.
- Generate a structured AI patch; reject one patch and apply selected changes for another.
- Run the same test scenario twice and verify that run metadata supports comparison.
- Verify backup/restore and encrypted-key unlock.
- Check offline authoring after the PWA cache is installed.
