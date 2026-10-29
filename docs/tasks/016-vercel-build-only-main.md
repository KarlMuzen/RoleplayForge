# Task 016: Vercel builds only for `main`

Status: todo
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
Done: nothing yet.
Left: everything.
Next action: confirm the two documentation facts, then edit `vercel.json`.

## Result (executor, when finished)
Pull request:
Checks run by executor:
CI:
Preview link: n/a (Decision 19)
Deviations from the card:

## Review (Claude, required)
Pending.
