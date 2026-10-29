# Automation audit

Date: 2026-10-29. `main` head when written: `cfad9f5`. Sources: repo files (read from a clone), Vercel project data through the connector, owner screenshot of the ruleset. Anything not seen is marked unverified.

## What exists (verified)

- **GitHub Actions:** one workflow, `ci.yml`, one job `test-and-lint` (type check + lint, tests, production build). Runs on every pull request to `main` and on pushes to `main` except `docs/**` and `*.md`. Superseded runs are cancelled. npm cache is on.
- **Ruleset `main-ci-gate`** (owner screenshot): active, targets `main` only. Bypass list: repository admin (always) and the Claude GitHub connector (always). The rules section was not visible, so whether it requires `test-and-lint` is unverified.
- **Vercel project `roleplayforge`:** production deploys from `main`. Preview deployments are made for pull-request branches (seen for the PR #2 branch). `vercel.json` has an `ignoreCommand` that skips docs-only commits; the recent docs commits show state CANCELED, so it works. Security headers and CSP are set in `vercel.json`.
- **Not present** in `.github/`: Dependabot config, CodeQL workflow, pull-request template, CODEOWNERS.
- `scripts/ui-audit.py` (Playwright) exists but is not in CI.

## Worth doing, best value first

1. **Phone test before merge, no new tooling.** Each executor pull request already gets a Vercel preview. The executor puts the preview link in the card's Result; the owner opens it on the phone. Unverified: whether Vercel posts the link as a pull-request comment. The connector gets 403 on protected previews, so the owner opens it, not Claude.
2. **Dependabot** (`.github/dependabot.yml`): weekly, grouped, npm and github-actions, major versions ignored, small open-PR limit. Gives security patches without manual watching. Cost: some PR noise. Goes through a card, because it is not a docs file and CI will run on it.
3. **Secret scanning and push protection:** the app handles API keys, and `.env.example` exists. Owner confirms both are on (Settings, Code security). No code needed.
4. **CodeQL default setup:** optional toggle in the same settings page. Expect some noise on a client-side app. Low priority.
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

## Owner actions, in order

1. Settings, General, Pull Requests: allow auto-merge, allow squash, auto-delete head branches (if not done).
2. In ruleset `main-ci-gate`, Rules: confirm "Require status checks to pass" with `test-and-lint`.
3. Settings, Code security: confirm secret scanning and push protection are on.

After 1 and 2, Claude writes the Dependabot card.
