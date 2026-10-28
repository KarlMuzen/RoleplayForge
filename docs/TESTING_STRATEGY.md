# Testing Strategy

## Current CI boundary

The current GitHub Actions workflow runs:

```bash
npm ci
npm run lint
npm test
```

The latest observed run for `main` commit `485d5e2` completed successfully on 2026-10-28. `npm run lint` includes TypeScript checking and ESLint. The workflow does **not** currently run `npm run build`; build status therefore remains unverified by CI until the workflow is updated and passes. See [project status](PROJECT_STATUS.md).

Run the full local release check before tagging a release:

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
