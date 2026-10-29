# Automation audit

Date: 2026-10-29. `main` head when written: `cfad9f5`. Sources: repo files (read from a clone), Vercel project data through the connector, owner screenshot of the ruleset. Anything not seen is marked unverified.

**Status: on hold.** Owner decision, 2026-10-29: set up nothing new for now, so work keeps moving. "Worth doing" below is a menu, not a plan. Revisit after the quick-wins cards (001-006) and the Details reorder are merged. Items 1 and 3 need no setup.

## What exists (verified)

- **GitHub Actions:** one workflow, `ci.yml`, one job `test-and-lint` (type check + lint, tests, production build). Runs on every pull request to `main` and on pushes to `main` except `docs/**` and `*.md`. Superseded runs are cancelled. npm cache is on.
- **Ruleset `main-ci-gate`** (owner screenshot): active, targets `main` only. Bypass list: repository admin (always) and the Claude GitHub connector (always). Owner reports the required check is set.
- **Vercel project `roleplayforge`:** production deploys from `main`. Preview deployments for `wip/*` branches are switched off (Task 011); only `main` deploys, and Task 016 extends the skip to every other branch. Vercel sometimes never starts a build for a `main` push; recovery is in `PROJECT_STATE.md`, Decision 22. `vercel.json` has an `ignoreCommand` that skips docs-only commits; the recent docs commits show state CANCELED, so it works. Security headers and CSP are set in `vercel.json`.
- **Secret scanning and push protection:** on (owner screenshot).
- **Not present** in `.github/`: Dependabot config, CodeQL workflow, pull-request template, CODEOWNERS.
- `scripts/ui-audit.py` (Playwright) exists but is not in CI.

## Worth doing later, best value first

1. **Phone test, no new tooling.** Superseded by Decisions 17 and 19: executor pull requests get no Vercel preview; the owner checks production in a batch. (Original text: each executor pull request gets a Vercel preview and the executor puts the link in the card's Result.) Not a merge gate (see PROJECT_STATE, Current task). Unverified: whether Vercel posts the link as a pull-request comment. The connector gets 403 on protected previews, so the owner opens it, not Claude.
2. **Dependabot** (`.github/dependabot.yml`): weekly, grouped, npm and github-actions, major versions ignored, small open-PR limit. Gives security patches without manual watching. Cost: some PR noise. Deferred.
3. **Secret scanning and push protection:** already on.
4. **CodeQL default setup:** optional toggle in Settings, Code security. Expect some noise on a client-side app. Deferred.
5. **Mobile smoke test + axe in CI** (HANDOFF step 5): do it after the contrast and tap-target pass. Today the audit shows many failures, so a gate would be red from day one.

## Not worth it now

- **Vercel Web Analytics / Speed Insights:** conflicts with the local-first, privacy-first principle. Skip unless the owner decides otherwise.
- **Vercel runtime logs and errors through the connector:** the app is a static browser PWA with no server code, so there is nothing to read.
- **Merge queue, release automation, Lighthouse CI:** too little value at this size.
- **Playwright against previews in CI:** heavy. Revisit after item 5.

## Gaps and risks found

- CI skips docs-only pushes, so the required check never reports on them. Docs commits to `main` only work because of the bypass list.
- The ChatGPT connector is not on the bypass list (only two actors were visible). A docs push by it would be rejected; it should use a pull request, which matches `AI_WORKFLOW.md`.
- Docs-only pull requests do run CI (no path filter on `pull_request`). Harmless, slightly wasteful.
- Claude's docs commits to `main` bypass the ruleset, so a bad docs commit lands unreviewed. Accepted for docs (Decision 13).
- Reading github.com pages through a web fetch gave stale or blocked results (folder pages blocked; root listing missed files that exist). Use `git clone` to read. A clone has no push credentials, so writes still go through the GitHub tool, which resends whole files.

## Owner actions

None needed now. The GitHub settings in `AI_WORKFLOW.md` are reported done.
