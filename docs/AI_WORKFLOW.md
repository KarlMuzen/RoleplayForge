# AI workflow (FINAL)

Final since 2026-10-30. Only the owner changes this file, by saying "change workflow". Neither AI edits it, bends it or works around it. If a rule blocks the work, the AI stops and names the rule.

## Jobs

| | Owner | Claude | ChatGPT |
|---|---|---|---|
| Is | Decides goals. Non-technical. | Architect, designer, reviewer, researcher | Executor |
| Writes | Nothing technical. Says the trigger phrases. | Docs only: `PROJECT_STATE.md` (sole writer), task cards, `docs/research/`, `docs/*`. Never bulk code. | Code, tests, branches, pull requests, its own card's Progress and Result |
| Never | Is asked to paste code or summaries | Edits app code (except "Minor direct commits") | Redesigns, changes scope, decides, edits `PROJECT_STATE.md`, this file, other cards or research |

## Truth

1. The repo is the only source. Chat history is disposable. Read it with `git clone` or `git fetch`, not web pages.
2. Authority, highest first: the owner's latest explicit instruction, this file (process), `PROJECT_STATE.md` (state and product decisions), the task card (the task), everything else. On a conflict the AI stops and flags it. It does not guess.
3. Before any write (commit, branch, card number) fetch `origin`, confirm the `main` head, list open pull requests. If the repo holds work you did not expect (a card another chat wrote, an open PR), stop and report. Never duplicate it.
4. A feature is unimplemented until code and evidence exist.

## Owner phrases (the whole vocabulary)

- `Execute docs/tasks/NNN-name.md` (ChatGPT)
- `Review docs/tasks/NNN-name.md` (Claude)
- `sync` (Claude refreshes `PROJECT_STATE.md` from merged and open PRs)
- `handoff` (the current AI updates Progress, or for Claude the Current task, then gives a paste block of at most 10 lines: goal, current task, open PR, next action)
- `change workflow` (the only way this file changes)
- Anything else said to Claude is an idea or a problem. Claude plans; it does not code.

## Loop

1. **Plan (Claude).** Read the repo. Verify any outside claim in code or the primary source first (`docs/research/`). New card number = highest in `docs/tasks/` plus 1; a number is never reused or renamed. One card = one outcome, normally 5 files or fewer. Commit the card and the `PROJECT_STATE.md` Current task in the same push.
2. **Execute (ChatGPT).** Branch `wip/NNN` from the latest `main`. The first commit sets the card to `in progress`. Do exactly what the card says. Pull request to `main`, title = one-line commit message. Update Progress every commit.
3. **Review (Claude).** The card says `Review: required` when it touches `src/io`, `src/store`, `src/db`, `src/schemas`, crypto, passkey, sync or security code, CI or deploy config, deletes user data, or adds a dependency. Otherwise `Review: skip`. For required cards the executor stops after green CI and reports. Claude reads the PR diff and CI result, then writes `Approved` or `Changes needed: <list>` in the card's Review section. Fixes go on the same branch. After 2 review rounds Claude rewrites the card.
4. **Merge (ChatGPT).** When `test-and-lint` is green and the card is `skip` or Approved: squash-merge by hand (no auto-merge). Check that the merge commit has a READY production deployment; if none exists, recover with `PROJECT_STATE.md` Decision 22. Mark the card `done` in a docs commit to `main` (`docs: mark Task NNN complete after merge`). Report in 8 lines or fewer: PR number, merge SHA, CI, deployment, checks run.
5. **Sync (Claude).** Refresh `PROJECT_STATE.md` in the same session as: a new card, a merged card, a decision. Not after every small step.

## Gate

- The only gate is `test-and-lint`. Vercel status is informational. Owner phone checks never block a merge; problems become new cards.
- Code reaches `main` only through a pull request from `wip/NNN`. Docs-only changes may go straight to `main`.
- After a red CI the executor gets 2 fix attempts, then stops and writes the failure in the card's Result.

## Executor stops and sends one message

The card is unclear or conflicts with the repo; the change needs a file under "Do not touch"; it touches a frozen identifier; it needs a new dependency; CI is red after 2 fixes; the change grows 2 or more files past the card's list. It never improvises.

## Minor direct commits by Claude (standing owner instruction)

Only when all hold: 3 files or fewer; 50 changed lines or fewer; none in `src/io`, `src/store`, `src/db`, `src/schemas`, crypto, passkey, sync, CI or deploy config; Claude ran `npm run lint && npm test && npm run build` on a fresh clone and reports the results. The commit SHA goes in the `PROJECT_STATE.md` Done list. Anything else is a card.

## Both AIs

- Never invent APIs or packages. Say "I don't know".
- Report only checks actually run. "Not run" is a valid answer. Nothing is "verified" without evidence.
- Plain language. Report a commit SHA and one line, not diffs. Link paths, never paste files.
- Respect the frozen identifiers in `PROJECT_STATE.md` Guardrails.
- Do not contradict existing repo work. Flag conflicts first.

## Keep the repo lean

A card is written only when it is next to run; later items live in `docs/ROADMAP.md`. Research notes hold findings, not decisions. A document that duplicates `PROJECT_STATE.md` or git history is deleted. No new doc type without the owner's word.

## Cost

Read only the files the task needs, and line ranges of large files. Edit large files from a local clone. The GitHub tool resends whole files, so one push per task where possible. Skip Claude's review for low-risk cards; CI is enough.

## Task card template

Save as `docs/tasks/NNN-name.md`.

```
# Task NNN: <title>

Status: planned | in progress | done | changes needed
Review: required | skip
Goal: <one sentence>
Files to touch: <exact paths>
Do not touch: <paths or areas>
Changes: <precise steps; code only where the design depends on it>
Done when: <CI green + what the owner can see>
Decisions: <PROJECT_STATE.md decision numbers this relies on>

## Progress (executor, update every commit)
Done: 
Left: 
Next action: 

## Result (executor, when finished)
Pull request: 
Checks run by executor: 
CI: 
Deviations from the card: 

## Review (Claude, if required)
Approved | Changes needed: <list>
```

## Bootstrap lines

- Claude or any AI: `Repo KarlMuzen/RoleplayForge. Read PROJECT_STATE.md, then docs/AI_WORKFLOW.md. Check open PRs. Continue the Current task.`
- Executor: `Execute docs/tasks/NNN-name.md.`
- Reviewer: `Review docs/tasks/NNN-name.md.`

## ChatGPT standing instructions (paste once into its project instructions)

```
You are the executor for repo KarlMuzen/RoleplayForge. Claude is the architect and reviewer; the owner is non-technical.
Every chat: clone or fetch the repo, read PROJECT_STATE.md, then docs/AI_WORKFLOW.md, check open PRs, then the task card named in the message.
Follow docs/AI_WORKFLOW.md exactly. It is final. Do exactly what the card says: branch wip/NNN, one PR, update the card's Progress and Result only.
Never edit PROJECT_STATE.md, docs/AI_WORKFLOW.md, other cards or docs/research. Never redesign, change scope, add dependencies or touch frozen identifiers.
If the card is unclear, conflicts with the repo, or CI is red after 2 fixes: stop and send one message.
Merge by hand only after green test-and-lint (and Approved if the card says Review: required). Report PR number, merge SHA, CI, deployment, checks run. Never claim a check you did not run.
```
