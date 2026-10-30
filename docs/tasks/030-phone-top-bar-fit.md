# Task 030: Phone top bar fits: Undo and Redo no longer sit on top of the card name

Review: skip
Goal: At 360 to 393 px wide, the top row of the ContextBar shows the avatar, the card name, Undo, Redo, a small save dot, Chat and a "More" button with nothing drawn on top of anything else, and Undo and Redo look like buttons even when disabled.
Files to touch: `src/components/ContextBar.tsx`; new `src/components/ContextMoreMenu.tsx`; `test/ContextBar.test.tsx`.
Do not touch: store slices (undo and redo logic), `Navigation.tsx`, the tab strip row, the layout from the `sm` breakpoint up (it must look the same as now), the completeness checklist behavior, frozen identifiers. No new dependency (the `Ellipsis` icon is in the installed lucide-react 0.546).
Evidence (Claude, 2026-10-30, read of `main` `9e5b44d` plus the owner's 393 px phone screenshot): the top row holds up to nine items. Below `sm`, the fixed-width controls are Undo 44, Redo 44, save text about 48, Pre-Flight with its Free chip about 77, Chat about 66 and Help 44 px, plus gaps: about 343 px in a row of about 369 px. The left group (`flex-1 min-w-0`) shrinks to about zero, but the avatar and the "FORGE" label are `shrink-0`, so they overflow underneath the Undo and Redo buttons, and the card name is not visible. Disabled Undo and Redo (opacity 30, no edge) look like decoration around the label. Decision 6 allows a top bar of back, name, status chip, undo and redo. ROADMAP Priority 1 lists the overflow menu as still open and says save state is a small dot. Claude could not render the page; the widths come from the Tailwind classes and the screenshot positions.
Design (the whole spec; do not improvise):
1. Left group, below `sm`: hide the mode label ("Forge" or "Test") and the bullet after it (`hidden sm:inline`); the tab strip below already names the mode. Make the wrapper around the card name `min-w-0 overflow-hidden` (the name keeps `truncate`). Do not put `overflow-hidden` on the group that holds the completeness checklist popup: it would clip it.
2. Undo and Redo: keep both 44 px tap targets, names and handlers. Add a visible edge so they read as buttons when disabled: `border border-knight-700/50 bg-void-900/60`, and disabled opacity 40 instead of 30.
3. Save state: keep the existing `<span aria-live="polite">` with the same four texts and keep `whitespace-nowrap` in its classes (an existing test checks both). Make it visually hidden below `sm` (`sr-only sm:not-sr-only`). Next to it add an 8 px round dot, `aria-hidden`, shown below `sm` only: amber for Unsaved, cyan for Saving, emerald for Saved, red for Save failed.
4. Pre-Flight Audit button: visible from `sm` up only (`hidden sm:flex`); no other change.
5. Help button: visible from `sm` up only (`hidden sm:flex`); no other change.
6. New `ContextMoreMenu.tsx`: a button visible below `sm` only (`sm:hidden`), 44 px, `Ellipsis` icon, `aria-label="More actions"`, `aria-expanded`, `aria-controls`. Use the disclosure pattern of the completeness checklist in `ContextBar.tsx` (not an ARIA `menu`). The panel is rendered only while open, placed under the button, right-aligned, `w-56`, holding ordinary buttons, each at least 44 px high: "Pre-Flight Audit" with the Free chip (only under today's condition: a Forge tab and an active card) and "Help and documentation". Escape and a tap outside close it and return focus to the trigger. Choosing an item closes the panel, then runs the same action the inline button runs today (the store's pre-flight and onboarding setters). Because the panel exists only while open, the inline Pre-Flight and Help buttons stay the only matches in tests that look for them.
7. Chat button: unchanged (below `sm` only, in the bar).
8. Order below `sm`: avatar, card name, Undo, Redo, save dot, Chat, More.
Width budget the classes must meet: at 360 px wide the fixed controls take about 226 px, which leaves about 100 px for the avatar and the name.
Tests (`test/ContextBar.test.tsx`, vitest; keep every existing test green; one test per line):
   - "More actions" opens a panel with "Pre-Flight Audit" and "Help and documentation"; Escape closes it and focus returns to the trigger.
   - A tap outside closes the panel.
   - Choosing "Pre-Flight Audit" opens the audit (read the store field name) and closes the panel.
   - Choosing "Help and documentation" opens onboarding and closes the panel.
   - With no active card the panel has no "Pre-Flight Audit".
   - Undo and Redo still have their names and disabled states; the four save texts still render (existing tests).
Not in this card: the status chip with tokens and issue count, a back button, the card switcher sheet, keyboard-open mode, any desktop change, any store change, moving Chat, ROADMAP 6b ("Unsaved" after save).
Done when: CI green. Owner, phone (not a merge gate): at 393 px the card name is readable, Undo and Redo sit to its right with visible edges, nothing overlaps, and More shows Pre-Flight Audit and Help.
Decisions: 6, 24.
