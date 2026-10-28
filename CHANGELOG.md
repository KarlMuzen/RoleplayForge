# Changelog

## Unreleased — Documentation baseline (2026-10-28)

- Documented the Roleplay Forge product direction while explicitly identifying the legacy CardCrucible app and package branding that remains in the current source.
- Added product vision, phased roadmap, platform/format support matrix, testing strategy and a repository checkpoint.
- Recorded the current CI boundary: dependency installation, lint/type checking and tests run; the workflow does not yet run a production build.
- Documentation-only change. No application source, package metadata, storage schema, encryption identifiers or sync identifiers were changed.

## 0.3.0

- **Architecture (Store Slices):** Decomposed monolithic Zustand store (`useCardStore`) into modular, decoupled domain slices (`cardSlice`, `profileSlice`, `sessionSlice`, `uiSlice`, `assistantSlice`) with typed selectors and isolated action boundaries.
- **Component Decomposition:** Refactored monolithic views (`CrucibleView`, `EditorView`) into focused subcomponents and dedicated custom hooks (`useCrucibleRun`, `useFieldRegeneration`, `DiagnosticScorePanel`, `IdentitySection`, `GreetingsSection`, `LorebookLinksSection`, `AdvancedPromptsSection`, `ExportVerifyModal`).
- **Type Safety & Quality:** Replaced untyped `any` annotations across application components, IO handlers, utilities and tests with strict Zod-inferred models, schema definitions and safe error guards.
- **Regression Guardrails:** Added ESLint guardrails (`max-lines` set to 400 lines excluding blank lines/comments, `complexity` threshold set to 15) scoped to application sources.

## 0.2.0

- **Feature:** Replaced legacy text-only responses in Assistant and Enhancer views with a Zod-validated structured card patch execution system (`cardPatchSchema`).
- **Feature:** Introduced `PatchPreviewPanel` for side-by-side visual diffing, rationale display and selective application of proposed card edits.
- **Architecture:** Added pure `applyCardPatch()` utility with unit tests for immutable updates and undo/redo integration.

## 0.1.1

- **Bug Fix:** Fixed undo/redo persistence by saving history to IndexedDB and flushing it automatically on tab close.

## 0.1.0

- **Security:** Backup exports redact API keys by default unless explicitly opted in.
- **Bug Fix:** Fixed Crucible judge-profile selection and debounced token counting to reduce unnecessary API calls.
- **CI:** Added a GitHub Actions workflow for automated linting and tests.
