# Task 011: No Vercel deployments for wip branches

Status: in progress
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
Done: Added the `git.deploymentEnabled` rule for `wip/*` in `vercel.json`; preserved `ignoreCommand` and the complete `headers` block.
Left: Open PR, check `test-and-lint`, fill in Result, merge on green CI.
Next action: Open the PR and inspect required CI.

## Result (executor, when finished)
Pull request: 
Checks run by executor: 
CI: 
Preview link: n/a (Decision 19)
Deviations from the card: 

## Review (Claude, if required)
n/a (Review: skip)
