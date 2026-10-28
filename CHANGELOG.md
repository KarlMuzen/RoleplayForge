# Changelog

## Unreleased — Documentation baseline (2026-10-28)

### Visual refresh
- Introduce a warm parchment-and-charcoal theme with a muted clay accent and calm focus states.
- Replace the generic sparkle with a card-and-anvil Roleplay Forge mark; regenerate PWA, favicon and Apple touch assets from one SVG source during builds.
- Update app title, navigation terminology, guide/security copy, package metadata and PWA manifest branding.
- Remove forced portrait locking, keep the four labeled primary destinations, and expose contextual help in Forge and Test.
- Improve Library drag scrolling, empty states, create action, sticky bulk actions and explicit export choices.
- Make AI response text selectable and simplify patch review to a single selection-aware apply action.
- Add missing legacy utility tokens/classes and synchronous theme preference bootstrap; preserve existing IndexedDB theme storage and other data identifiers.

- Documented the Roleplay Forge product direction and conservative platform-support boundary.
- Added product vision, phased roadmap, platform/format support matrix, testing strategy and a repository checkpoint.
- Extended CI to run dependency installation, lint/type checking, automated tests and a production PWA build.
- Existing IndexedDB keys, encryption formats, passkey identifiers and sync identifiers remain unchanged.

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
