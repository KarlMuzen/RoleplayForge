# Task 016: Vercel builds only for `main`

Status: in progress
Review: required
Goal: Vercel starts a build only for a code commit on `main`. Every other branch is skipped by the ignore command, so no branch, current or future, can use the Hobby plan's 100 deployments per day.
Files to touch: `vercel.json`
Do not touch: the `headers` block, the existing `git.deploymentEnabled` entry for `wip/*`, `src/`, `test/`, any other file, Vercel dashboard settings, the project name (`roleplayforge`, Decision 20).
Context: `wip/*` branches already do not deploy (Task 011) and docs-only commits are skipped by `ignoreCommand`. This card closes the one gap left: a branch with any other name still builds. Review is required because a wrong command could silently stop production builds.
Changes:
1. In `vercel.json`, replace only the value of `ignoreCommand` with:
   `[ \"$VERCEL_GIT_COMMIT_REF\" != \"main\" ] || git diff --quiet HEAD^ HEAD -- . ':!docs' ':!*.md'`
   Meaning: exit code 0 makes Vercel skip the build. On any branch other than `main` the first test succeeds, so the build is skipped. On `main` the old docs-only test decides, as today.
2. Before editing, confirm two facts in the Vercel docs and quote the URL in Result: that `VERCEL_GIT_COMMIT_REF` is a documented system environment variable (https://vercel.com/docs/environment-variables/system-environment-variables) and that an Ignored Build Step exit code of 0 skips the build (https://vercel.com/docs/project-configuration). If either cannot be confirmed, stop and say so in Result. Do not guess.
3. Keep the file valid JSON with 2-space indentation. Check it: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))"`.
4. If `test/securityHeaders.test.ts` fails only because of this change, stop and say so in Result. Do not edit the test.
Done when: CI green and Claude's review is Approved. After the merge, Claude checks through the Vercel connector that the merge commit itself produced a READY production deployment. If it did not, Claude deploys by hand and opens a fix card.
Decisions: 17, 19, 20, 22.

## Progress (executor, update every commit)
Done: Confirmed the two Vercel documentation facts, changed only `ignoreCommand`, preserved `git.deploymentEnabled` and `headers`, and opened PR #18. JSON parsing passed via `node -e`; `test-and-lint` passed on current code commit `200d758933f8ae5dac13e36e6dcab323a05aac15` (run 40862800567) and latest PR head `4c1a9c2da6aff9417bc811da26b9adb95b6b337a` (run 40863064296).
Left: Required Claude review and approval before merge.
Next action: Review PR #18; do not merge until the card's Review is Approved.

## Result (executor, when finished)
Pull request: https://github.com/KarlMuzen/RoleplayForge/pull/18
Checks run by executor: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))"` passed against the candidate `vercel.json` contents.
CI: Passed `test-and-lint` (lint, tests, production build), run 40862800567, on `200d758933f8ae5dac13e36e6dcab323a05aac15`.
Vercel documentation confirmed: `VERCEL_GIT_COMMIT_REF` is the triggering Git branch, https://vercel.com/docs/environment-variables/system-environment-variables (section `VERCEL_GIT_COMMIT_REF`); `ignoreCommand` exit code 0 skips the build and exit code 1 continues, https://vercel.com/docs/project-configuration/vercel-json (section `ignoreCommand`).
Preview link: n/a (Decision 19)
Deviations from the card: None. Review is required; waiting for Claude approval before merge.

## Review (Claude, required)
Pending.
