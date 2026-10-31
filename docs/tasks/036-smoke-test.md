# Task 036: Smoke test script for the built app

Review: skip
Goal: One script, `scripts/smoke.py`, drives the built app in Chromium, prints a pass or fail line per check as JSON, and exits 1 on any failure, so a broken screen or a lost card is found by one command and not by the owner's phone.
Files to touch: `scripts/smoke.py` (new, one file)
Do not touch: `src/`, `package.json`, `package-lock.json`, `.github/`, `vercel.json`, `public/`, `docs/`, `scripts/ui-audit.py`, `scripts/generate-pwa-icons.js`. No `data-testid` or any other change to app code. No npm dependency. No CI step.
Changes:
1. Model the script on `scripts/ui-audit.py`: Python Playwright (installed with pip on your machine, not added to the repo), the same environment variables (`RF_URL`, default `http://127.0.0.1:4173/`; `RF_CHROME`, optional Chromium path; `RF_OUT`, screenshot folder, default `/tmp/rf-smoke`), `--no-sandbox`, service workers blocked. A docstring at the top gives the usage in the same style: `npm ci && npx vite build`, `npx vite preview --port 4173 &`, then `python3 scripts/smoke.py`.
2. The script writes its own small test card to a temp file (CCv3 JSON: `spec` `chara_card_v3`, `spec_version` `3.0`, `data` with name "Smoke Test Card", a description, a first message and one lorebook entry) and imports it through the Library file input, the way `ui-audit.py` does. If the app does not accept that file, stop and report; do not change app code.
3. From the first page load on, collect page errors, console errors and failed requests to the app's own origin. Each one is a failed check named `no runtime errors` with the first 200 characters of its text.
4. Checks, run on a phone-size screen (390x844, touch). Each check has a name in the output. A check that throws is recorded as `fail: <message>` with a screenshot in `RF_OUT`, and the run goes on to the next check.
   - `app loads`: the Library shows and the error screen from `src/components/ErrorBoundary.tsx` is not on the page (read that file for its wording).
   - `import`: after importing, "Smoke Test Card" shows in the Library.
   - `open card`: opening it shows Details with the name.
   - `edit and save`: append " smoke" to the description, press Save, reload the page (new page load, same browser context), open the card again; the description ends with " smoke". This proves the card survives in IndexedDB.
   - `screens`: open Lorebook, Prompt, Assist, Test, Enhancer, Settings and Guide the way `ui-audit.py` does. For each: no error screen, no horizontal overflow (`scrollWidth` not more than `innerWidth + 1`). A screen the app no longer has is written `skipped: not found` and listed in the PR description; it is not a failure.
   - `export json`: export the card as JSON from Details "Cover art and export", capture the download, parse it, and check the card name is "Smoke Test Card" and the description ends with " smoke". If the export cannot be driven with visible-text or role locators, write `not covered: <reason>` and do not change app code.
   - `desktop`: in a fresh context at 1280x800, the checks `app loads`, `import` and `open card` pass.
5. Locators: role, visible text, label and alt text only, as in `ui-audit.py`. No Tailwind class selectors and no positions. Waits wait for an element or state, not for a fixed time, except the short settle pauses `ui-audit.py` already uses.
6. Output: one JSON object printed at the end, `{"checks": {"<name>": "pass" | "fail: <msg>" | "skipped: <reason>" | "not covered: <reason>"}, "errors": [...]}`. Exit code 1 if any check is `fail`, else 0. Also print and exit 1 if the script itself crashes.
7. Run it twice on the final build and paste both outputs in the PR description under `Checks run`. If a check passes once and fails once with no change, make the wait in the script stricter; if it is still unstable, say which check in the PR description.
Done when: CI green (the script is not in CI, and the PR changes only `scripts/smoke.py`); both runs are in the PR description; every `fail` is either fixed in the script (a script bug) or listed in the PR description as an app finding with its check name and screenshot path. Do not fix app findings in this PR; Claude turns them into BUGS entries or cards. The owner sees nothing on the phone; the PR description is the result.
Stop and send one message if: Playwright or Chromium cannot be started in your environment (say what failed), the app does not accept the generated card, or a check needs a change to app code.
Decisions: 17, 19, 33
