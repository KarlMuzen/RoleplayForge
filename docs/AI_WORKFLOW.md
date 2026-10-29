# AI workflow

Two AIs, one repo. The repo is the source of truth. Chat history is disposable: if a chat hits a usage limit, nothing may be lost.

## Roles

| | Claude | ChatGPT |
|---|---|---|
| Job | Architect, designer, reviewer | Executor |
| Writes | `PROJECT_STATE.md` (sole writer), task cards, decisions, docs | Code, tests, branches, pull requests, its own card's Progress and Result |
| Does not | Write bulk code | Redesign, change scope, make decisions, edit `PROJECT_STATE.md` |

The owner passes only a task number or a bootstrap line, never pasted code or summaries.

## Status sources

- **In progress** = open pull requests (branch `wip/NNN`) and their task cards.
- **Done** = squash-merged pull requests on `main`.
- **Detail** = the task card.
- `PROJECT_STATE.md` holds goal, structure, decisions, current task and next steps. Claude refreshes it from merged and open pull requests at the start of each planning session, not after every task.

## Loop

1. **Plan (Claude).** Owner states a goal. Claude reads the repo, records decisions in `PROJECT_STATE.md`, commits task cards `docs/tasks/NNN-name.md`. Each card says `Review: required` or `Review: skip`.
2. **Execute (ChatGPT).** Owner says "Execute docs/tasks/NNN-name.md". ChatGPT works on branch `wip/NNN`, does exactly what the card says, opens a pull request to `main` (squash, title = one-line commit message), waits for CI, and fills in the card's Progress and Result.
3. **Review (Claude), only if the card says required.** Owner says "Review docs/tasks/NNN-name.md". Claude reads the pull request diff and CI result and writes Approved or Changes needed in the card. Changes become a new card, not chat instructions.
4. **Merge.** When the card says `Review: skip`, or the review is Approved, ChatGPT enables auto-merge (squash). GitHub merges when `test-and-lint` is green. Until the one-time settings below are done, the owner taps Merge instead.

If a card is unclear, conflicts with the repo, or needs a decision, the executor stops and says so in one message. It does not improvise.

## The CI gate

`.github/workflows/ci.yml` runs lint, tests and a production build in one job, `test-and-lint`. It runs on pull requests to `main` and on pushes to `main` except docs-only pushes. It does **not** run on pushes to other branches until a pull request is opened.

- Code changes always go on branch `wip/NNN` with a pull request. Never push code straight to `main`, because CI would only run after the damage.
- Docs-only changes (`docs/`, `*.md`) may go straight to `main`. CI skips them anyway. If such a push is rejected by the branch rule, send it as a pull request instead.
- Merge only when `test-and-lint` is green. If CI fails, fix it on the same branch.
- **Retry cap:** the executor gets 2 fix attempts after a red CI. Then it stops and writes the failure in the card's Result. It does not loop.
- The executor runs `npm run lint && npm test && npm run build` itself only if it can. CI is the authority either way. Result says which checks the executor ran.

## One-time GitHub settings (owner)

1. Settings, General, Pull Requests: allow auto-merge; allow squash merging; turn on automatically delete head branches.
2. Settings, Branches, rule for `main`: require status check `test-and-lint`. Leave "include administrators" off, so docs commits by the owner or the AIs still work. The check only appears in the picker after CI has run recently.

If the auto-merge button is missing, the required check on `main` is probably not set. Auto-merge depends on it.

## Surviving a usage limit mid-chat

- Every chat starts with a bootstrap line (below). Nothing is assumed from earlier chats.
- Commit small and often. Work not yet committed dies with the chat; committed work does not.
- The first commit on `wip/NNN` sets the card to `in progress`. Every commit updates the card's Progress line (done, left, next action).
- On the word "handoff", or when a chat gets long, the AI updates Progress first (Claude: the Current task in `PROJECT_STATE.md`), then gives a paste block of at most 10 lines.
- The next AI reads `PROJECT_STATE.md`, lists open pull requests, then reads the card.

## Cost rules

- A card is one outcome, ideally 5 files or fewer.
- Read only the files the card names. For large files, read only the needed line range.
- Never paste files into chat. Refer to paths, pull request numbers and commit SHAs.
- Report the pull request number and a one-line summary, not the full diff.
- Claude plans and reviews; ChatGPT types. Put the design in the card so the executor does not guess.
- Skip Claude's review for small, low-risk cards. CI is enough there.
- One writer for `PROJECT_STATE.md` (Claude): every edit resends the whole file, and two writers cause conflicts.
- Large files (`GuideView.tsx`, `cardSlice.ts`) are expensive through the GitHub tool, which resends whole files. Keep such cards to one file where possible.

## Bootstrap lines

- Any AI: `Repo KarlMuzen/RoleplayForge. Read PROJECT_STATE.md, then docs/AI_WORKFLOW.md. Check open PRs. Continue the Current task.`
- Executor: `Execute docs/tasks/NNN-name.md.`
- Reviewer: `Review docs/tasks/NNN-name.md.`

## Rules for both AIs

- Verify the `main` head before every commit to `main` and before creating a branch.
- Respect the frozen identifiers listed in `PROJECT_STATE.md`.
- Do not contradict existing repo work. Flag conflicts first.
- Never invent APIs or packages. Say "I don't know" when unsure.
- Plain language. The owner is non-technical.

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
