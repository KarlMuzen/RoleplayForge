# Task 013: Details, cover art and export move to one collapsed section at the bottom

Status: in progress
Review: skip
Goal: On the Details tab the cover art block and the export controls no longer sit above the writing fields. They live in one collapsed section, "Cover art and export", after the last form section.
Files to touch: `src/components/EditorView.tsx`
Do not touch: the files in `src/components/editor/`, the store, any handler or state in `EditorView.tsx`, `ExportVerifyModal`, frozen identifiers.
Context: HANDOFF step 3 and `docs/UI_UX_REDESIGN_SPEC.md` UX-DET-1 (item 7). Today the first screen on a phone shows Save/Export, the token panel and cover art before any writing field. Find blocks by their comment markers, not by line numbers.
Changes:
1. Top toolbar (`{/* Top Toolbar / Action Bar */}`): keep Save, Undo, Redo and Create Variant. Cut the right-hand `{/* Export & Verify Menu */}` div (the Export select and the Verify Export button).
2. Cut the whole `{/* COVER / AVATAR CARD HEADER */}` block.
3. After `<AdvancedPromptsSection ... />`, still inside the `{/* MAIN EDITOR FORM SECTIONS */}` wrapper, add a native `<details className="bg-void-900 border border-knight-700/40 rounded-2xl shadow-sm">`. Its `<summary>` is a row at least 44px tall (`min-h-11 flex items-center px-4 cursor-pointer text-sm font-semibold text-mist-100`) with the text `Cover art and export`. Closed by default.
4. Inside the `<details>`, in this order: the pasted Export select + Verify button row, then the pasted cover block. Paste both verbatim: same handlers, `aria-label`s, `title`s and classes. A native `<details>` keeps its content mounted, so file inputs and refs keep working.
5. If `test/CardAvatar.test.tsx` fails only because the cover is now inside a closed `<details>`, change the test (open it first). Do not change the app to suit the test.
Done when: CI green. Owner, phone, Details tab: no cover art or Export select above the fields; at the bottom a "Cover art and export" row that opens to the Export select, Verify button and the cover tools, all working as before.
Decisions: 6, 17, 19.

## Progress (executor, update every commit)
Done: Moved the existing Export & Verify Menu and complete cover/avatar block into a closed-by-default `Cover art and export` details section after `AdvancedPromptsSection`; handlers, inputs, labels, titles, styles, and surrounding editor state remain unchanged.
Left: Open PR, verify `test-and-lint`, fill Result, and merge only on green CI.
Next action: Confirm the diff is limited to `EditorView.tsx` plus this card, then create the PR.

## Result (executor, when finished)
Pull request: 
Checks run by executor: 
CI: 
Preview link: n/a (Decision 19)
Deviations from the card: 

## Review (Claude, if required)
n/a (Review: skip)
