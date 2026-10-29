# Task 014: Details, token budget and health check become one compact row

Status: done
Review: skip
Goal: The big token panel and the health banner on the Details tab are replaced by one short row of two chips that opens to the full details. The row never wraps on a 393px phone.
Files to touch: `src/components/EditorView.tsx`
Do not touch: the files in `src/components/editor/`, the store, token calculations (`totalTokens`, `tokenPercentage`, `descTokens` and the other counts), the `warnings` logic, frozen identifiers.
Context: HANDOFF step 3 and finding 2 (the token header wraps on real cards). Runs after Task 013 is merged. Find blocks by their comment markers.
Changes:
1. Remove the `{/* Token Budget & Density Bar */}` block and the `{/* Quality & Health Check Banner */}` block from their current places.
2. Directly under the top toolbar add one native `<details className="bg-void-900 border border-knight-700/40 rounded-2xl shadow-sm">`, closed by default. Its `<summary>` is a row at least 44px tall with two chips and a chevron:
   a. Token chip: `{totalTokens}/{tokenBudgetLimit} tok`, colored by `tokenPercentage` with the same thresholds the bar uses today (over 90 red, over 75 amber, otherwise emerald). Add `title` text `Estimated tokens`. Keep the text short so the row does not wrap at 393px.
   b. Health chip: when `warnings.length === 0`, a green chip with `CheckCircle2` and `OK`; otherwise an amber chip with `AlertTriangle` and `{warnings.length} alerts`.
3. Inside the `<details>`, below the summary, move the old content verbatim: the density bar, the Context limit `<select aria-label="Context limit">`, the breakdown chips (the `getTokenSchemeName(provider)` text goes here, with the full token line), and then the warnings list or the "Card Health Check Passed" message exactly as they render today.
4. The details stay closed even when there are alerts. The chip count is the signal; do not push the fields down.
Done when: CI green. Owner, phone, Details tab: under the toolbar one short row with a token chip and an OK/alerts chip, no wrapping; tapping it opens the old token panel and health details.
Decisions: 6, 8, 9, 17, 19.

## Progress (executor, update every commit)
Done: Replaced the separate token and health panels with one closed-by-default details row under the toolbar. The summary displays a threshold-colored estimated token chip, a green OK or amber alert-count chip, and a chevron; the old token breakdown, context limit, density bar, and warning content remain inside the expanded section. Token calculations and warning logic are unchanged. PR #16 squash-merged.
Left: None.
Next action: Task 014 is complete; proceed to Task 015.

## Result (executor, when finished)
Pull request: https://github.com/KarlMuzen/RoleplayForge/pull/16
Checks run by executor: Not run locally; repository CI is authoritative.
CI: Passed `test-and-lint` (lint, tests, production build), run 40851787174, on `c3be74bf911b33519f9809ad6ab45071f5ce43e2`.
Preview link: n/a (Decision 19)
Deviations from the card: Auto-merge was rejected with "Pull request is in clean status"; manually squash-merged after `test-and-lint` passed, per Decision 19.

## Review (Claude, if required)
n/a (Review: skip)
