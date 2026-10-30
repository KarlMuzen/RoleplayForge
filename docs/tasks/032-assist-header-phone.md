# Task 032: Assist screen header fits a phone

Review: skip
Goal: On a phone the "Assistant" title in the Assist screen header no longer touches or hides behind the buttons next to it.
Files to touch: `src/components/AssistantView.tsx`.
Do not touch: `src/components/ContextBar.tsx` (the clipped "Details" tab is a separate, unconfirmed issue in `docs/BUGS.md`), any other screen, any test file, frozen identifiers. No new npm package.
Evidence (Claude, 2026-10-31, read of `main` `4808e13`; from an owner phone screenshot, not reproduced): in the "Sleek Compact Header" (line 374 on), the title `<h2>` (line 383) has `truncate shrink-0`, so it cannot shrink, and the right-hand group (line 396, `shrink-0`) holds the cover button, the card-name button with `max-w-[7rem]`, and the reset button. On a narrow screen the title runs into the cover button. The card name is already shown in the top bar, so the card-name text in the inspector button is not needed on a phone.

Changes (all in `AssistantView.tsx`, the header block only):
1. The `<div className="flex items-center gap-2">` that directly wraps the `<h2>` (line 382): add `min-w-0`.
2. The `<h2>`: remove `shrink-0`; keep `truncate`.
3. The right-hand group `<div className="flex items-center gap-2 shrink-0">` (line 396): change `gap-2` to `gap-1.5 sm:gap-2`.
4. The inspector button (the one with `title="Toggle Surface Inspector"`): add `aria-label="Toggle Surface Inspector"`. On its inner `<span className="text-[11px] font-mono uppercase max-w-[7rem] truncate">` add `hidden sm:inline` so the card name shows only from the `sm` breakpoint up. The eye and chevron icons stay on a phone.
Done when: CI green. Owner, phone: open Forge, Assist; "Assistant" is fully readable with a clear gap before the cover button, the inspector button shows the eye and arrow, and tapping it still opens the inspector.

Stops (send one message, do not improvise): any line above does not match the file; the change needs a file outside the one listed.
Checks: `npm run lint && npm test && npm run build`. Existing tests stay green and unchanged.
Decisions: none.
