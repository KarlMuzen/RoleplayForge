# Changelog

## 0.3.0

- **Architecture (Store Slices):** Decomposed monolithic Zustand store (`useCardStore`) into modular, decoupled domain slices (`cardSlice`, `profileSlice`, `sessionSlice`, `uiSlice`, `assistantSlice`) with typed selectors and isolated action boundaries.
- **Component Decomposition:** Refactored monolithic views (`CrucibleView`, `EditorView`) into focused subcomponents and dedicated custom hooks (`useCrucibleRun`, `useFieldRegeneration`, `DiagnosticScorePanel`, `IdentitySection`, `GreetingsSection`, `LorebookLinksSection`, `AdvancedPromptsSection`, `ExportVerifyModal`).
- **Type Safety & Quality:** Performed comprehensive elimination of untyped `any` annotations across application components, IO handlers, utilities, and test suites in favor of strict Zod-inferred models, schema definitions, and safe error guards (`err instanceof Error`).
- **Regression Guardrails:** Added automated ESLint guardrails (`max-lines` set to 400 lines excluding blank lines/comments, `complexity` threshold set to 15) scoped to application sources (`src/**/*.{ts,tsx}`) to prevent future component bloat.

## 0.2.0

- **Feature:** Replaced legacy text-only responses in Assistant and Enhancer views with a real, Zod-validated structured card patch execution system (`cardPatchSchema`).
- **Feature:** Introduced `<PatchPreviewPanel />` for side-by-side visual diffing, rationale display, and selective application of proposed card edits (top-level fields & lorebook entries).
- **Architecture:** Added pure `applyCardPatch()` utility with unit tests verifying immutable card updates and full integration with `useCardStore` undo/redo stack.

## 0.1.1

- **Bug Fix:** Actually fixed the undo/redo persistence issue (which was incorrectly marked as fixed in 0.1.0). The undo history is now properly saved to IndexedDB and flushed automatically on tab close to prevent data loss.

## 0.1.0

- **Security:** Fixed an issue where backup exports included plaintext API keys. Keys are now redacted by default in exports unless explicitly opted in.
- **Bug Fix:** Fixed an issue in Crucible where the "judge" profile selector was being ignored, causing the model to judge itself instead of using the selected profile.
- **Bug Fix:** Token counting logic in the lab view is now debounced to prevent unnecessary API calls and potential rate limiting/billing spikes.
- **CI:** Added a GitHub Actions CI pipeline for automated testing and linting.
