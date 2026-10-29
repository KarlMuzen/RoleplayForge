# Task 017: One ContextBar replaces WorkspaceSubNav and LabSubNav

Status: in progress
Review: required
Goal: Forge and Test screens share one sticky two-row bar. Row 1: card avatar and name, incomplete-card checklist, Pre-Flight Audit, Chat (phone), Help. Row 2: section tabs, each at least 44px tall. The bar clears the phone status bar in the installed app.
Files to touch: new `src/components/ContextBar.tsx`; `src/App.tsx`; delete `src/components/WorkspaceSubNav.tsx` and `src/components/LabSubNav.tsx`; rename `test/WorkspaceSubNav.test.tsx` to `test/ContextBar.test.tsx`.
Do not touch: the store, routes (`src/routing/`), `src/constants/navigation.ts`, any view, `Navigation.tsx`, frozen identifiers.
Context: HANDOFF step 4, spec section 4.4 and P1-3 (`docs/UI_UX_REDESIGN_SPEC.md`). The two old components are near copies. Undo/Redo and the save chip come in Task 018, not here.
Changes:
1. Create `ContextBar` (no props). Mode comes from `activeTab`: tabs in `WORKSPACE_TABS` use the Forge tab list, tabs in `LAB_TABS` use the Test tab list. Tab lists and labels stay exactly as in the old components: Forge = editor "Details", lorebook "Lorebook", payload "Prompt", assistant "Assist"; Test = crucible "Stress tests", enhancer "Enhancer". Tabs only call `setActiveTab`.
2. Row 1, left to right: `CardAvatar` (same props as today), a small mode label ("Forge" or "Test"), the card name (truncate, "No character selected" when none), the checklist button, then on the right the Pre-Flight Audit button (Forge only, only with an active card, same behavior and "Free" tag as today), the phone-only Chat button (only with an active card, same as today), and the Help button.
3. Checklist: copy the accessible popover from `WorkspaceSubNav` unchanged (aria attributes, Escape closes and returns focus, outside tap closes, `min-w-11 min-h-11` touch size, same texts). It now also shows in Test mode, replacing the `title=` tooltip in the old `LabSubNav`.
4. Help button: `min-w-11 min-h-11`, same `aria-label`.
5. Row 2: a horizontally scrollable row (`overflow-x-auto no-scrollbar`) of buttons, each `min-h-11`, icon plus label, `whitespace-nowrap`. Active tab uses the same maroon highlight as today's indicator but as a plain class on the button, so the measuring code for the sliding indicator is removed. Active tab gets `aria-current="page"`. The Details tab keeps the amber warning icon when the card is incomplete (Forge only).
6. The root is `sticky top-0 z-20` with `bg-void-950/95 backdrop-blur-md border-b border-knight-700/40` and top padding `pt-[max(0.5rem,env(safe-area-inset-top,0px))]`. Keep the `max-w-7xl mx-auto` inner wrapper.
7. In `App.tsx` replace the two sub-nav lines with `{(isWorkspaceTab || isLabTab) && <ContextBar />}` and fix the imports.
8. Delete the two old component files. Rename the test file and update it: same checklist test against `ContextBar`, plus tests that (a) in Test mode (`activeTab: 'crucible'`) the two Test tabs render and the checklist button exists for an incomplete card, (b) every tab button has `min-h-11`, (c) clicking a tab sets `activeTab`.
Done when: CI green; no remaining import of the old components (`grep -r "SubNav" src test` returns nothing). Owner, phone: on Details, Lorebook, Prompt, Assist and on Test tabs the same bar appears, tabs are easy to tap, the bar stays at the top when scrolling, and in the installed app it sits below the status bar.
Decisions: 5, 6, 17, 19, 24.

## Progress (executor, update every commit)
Done: Verified `main` at `802e00803d0e4e3e9ced497f4b71768e8ca7e217`, checked the AI workflow and Task 017 scope, and created `wip/017`. Implementing the shared bar and focused regression tests.
Left: Open the PR, confirm CI, and obtain the required Claude review.
Next action: Finish the component, App integration, component deletion/test rename, then validate on PR CI.

## Result (executor, when finished)
Pull request:
Checks run by executor:
CI:
Preview link: n/a (Decision 19)
Deviations from the card:

## Review (Claude, if required)
Pending
