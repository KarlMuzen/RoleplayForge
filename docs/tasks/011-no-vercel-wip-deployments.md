# Task 011: No Vercel deployments for wip branches

Status: done
Review: skip
Goal: Branches named `wip/*` stop creating Vercel deployments, so pull requests stop using the Hobby plan's 100 deployments per day and stop showing a red Vercel status.
Files to touch: `vercel.json`
Do not touch: the `headers` block, the `ignoreCommand` line, `src/`, `test/`, any other file, Vercel dashboard settings.
Context: On 2026-10-29 Vercel rejected the preview for PR #10 with "Deployment rate limited — retry in 24 hours". Hobby allows 100 deployments per day (https://vercel.com/docs/plans/hobby). The Vercel status is not a merge gate (Decision 19), so this card does not wait for the limit to reset.
Changes:
1. In `vercel.json`, add one top-level key beside `ignoreCommand` and `headers`:
   ```json
   "git": {
     "deploymentEnabled": {
       "wip/*": false
     }
   }
   ```
   Source: https://vercel.com/docs/project-configuration/git-configuration (branch patterns use minimatch; branches not listed stay enabled, so `main` still deploys). Use no other key and no other pattern.
2. Keep the file valid JSON with its existing 2-space indentation.
3. If `test/securityHeaders.test.ts` fails only because of the new key, stop and say so in Result. Do not edit the test.
4. From now on a card's Result says `Preview link: n/a (Decision 19)`.
Done when: CI green. Nothing visible for the owner. Cannot be verified until Vercel's limit resets: later `wip/*` pull requests then show no Vercel status at all.
Decisions: 17, 19.

## Progress (executor, update every commit)
Done: Added `git.deploymentEnabled` for `wip/*` in `vercel.json`; preserved `ignoreCommand` and all security headers; PR #11 squash-merged.
Left: None.
Next action: Task 011 is complete; proceed to Task 009.

## Result (executor, when finished)
Pull request: https://github.com/KarlMuzen/RoleplayForge/pull/11
Checks run by executor: Not run locally; repository CI is authoritative.
CI: Passed `test-and-lint` (lint, tests, production build), run 40844139362, on `ff89c2a8c7d883dd1a61bc689d225bdb97b04fcb`.
Preview link: n/a (Decision 19)
Deviations from the card: Auto-merge was rejected with "Pull request is in clean status"; manually squash-merged after `test-and-lint` passed, per Decision 19.

## Review (Claude, if required)
n/a (Review: skip)
