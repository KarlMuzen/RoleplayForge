# Task 001: Guide close band

Status: done
Review: skip
Goal: The Guide's close (X) button floats over the content, with no empty grey band at the top and nothing covered when scrolled.
Files to touch: `src/components/GuideView.tsx`
Do not touch: any other component, `useModalA11y`, routing, frozen identifiers (PROJECT_STATE.md, Guardrails).
Changes:
1. Read only lines 170-200. The wrapper around the close button (`sticky top-0 z-30 -mt-4 md:-mt-6 flex justify-end bg-void-950/95 backdrop-blur-xl py-2`) becomes `sticky top-0 z-30 -mt-4 md:-mt-6 h-0 flex justify-end`: no background, no blur, no vertical padding, zero height, so it takes no layout space.
2. The X button keeps its size (`min-w-11 min-h-11`), `aria-label`, `onClick={handleClose}` and focus behaviour. Give it a clear shadow (for example `shadow-lg`) and keep its solid background, so it stays readable over text.
3. If the X overlaps the hero badge or title at 360px width, add top padding to the hero block only, not to the wrapper.
Done when: CI green. Owner on the Vercel preview, phone: at the top of the Guide there is no grey band; when scrolled the X stays reachable and does not hide the title.
Decisions: HANDOFF finding 1.

## Progress (executor, update every commit)
Done: Replaced the close-button wrapper with the specified zero-height, unstyled wrapper and added `shadow-lg` to the existing button class. The existing hero padding leaves space below the button at 360px, so no hero padding change was needed. PR #3 squash-merged after CI passed.
Left: None.
Next action: None; task complete.

## Result (executor, when finished)
Pull request: #3 — https://github.com/KarlMuzen/RoleplayForge/pull/3
Checks run by executor: Not run locally; `git clone` could not resolve `github.com`. GitHub CI is authoritative.
CI: Green — `test-and-lint` passed on final PR head `32cd7b0b9741ada1f7010a3c6531d6782bfe7608` (lint, tests, production build). Auto-merge completed with squash.
Preview link: https://roleplayforge-git-wip-001-xiorolab.vercel.app
Deviations from the card: None.

## Review (Claude, if required)
n/a (Review: skip)
