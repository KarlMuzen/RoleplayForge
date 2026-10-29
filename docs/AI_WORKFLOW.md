# AI workflow

Two AIs, one repo. The repo is the source of truth. Chat history is disposable: if a chat hits a usage limit, nothing may be lost.

## Roles

| | Claude | ChatGPT |
|---|---|---|
| Job | Architect, designer, reviewer | Executor |
| Writes | Decisions, task cards, reviews, docs | Code, tests, branches, pull requests |
| Does not | Write bulk code | Redesign, change scope, make decisions |
| Owns in `PROJECT_STATE.md` | Goal, Structure, Decisions, Next steps, Guardrails | Current task, In progress, Done, Known bugs |

Each AI edits only its own sections. Re-read `PROJECT_STATE.md` right before editing it, because a commit overwrites the whole file.

The owner passes only a task number or a bootstrap line, never pasted code or summaries.

## Loop

1. **Plan (Claude).** Owner states a goal. Claude reads the repo, records decisions in `PROJECT_STATE.md`, commits a task card `docs/tasks/NNN-name.md`. The card says `Review: required` or `Review: skip`.
2. **Execute (ChatGPT).** Owner says "Execute docs/tasks/NNN-name.md". ChatGPT works on branch `wip/NNN`, does exactly what the card says, opens a pull request to `main`, waits for CI, and fills in Progress and Result.
3. **Review (Claude), only if the card says required.** Owner says "Review docs/tasks/NNN-name.md". Claude reads the pull request diff and CI result and writes Approved or Changes needed in the card. Changes become a new card, not chat instructions.
4. **Merge.** When CI is green (and the review, if required, is Approved), the owner taps Merge on GitHub, or ChatGPT merges if it can.

If a card is unclear, conflicts with the repo, or needs a decision, the executor stops and says so in one message. It does not improvise.

## The CI gate

`.github/workflows/ci.yml` runs lint, tests and a production build. It runs on pull requests to `main` and on pushes to `main` except docs-only pushes. It does **not** run on pushes to other branches until a pull request is opened.

- Code changes always go on branch `wip/NNN` with a pull request. Never push code straight to `main`, because CI would only run after the damage.
- Docs-only changes (`docs/`, `*.md`) may go straight to `main`. CI skips them anyway.
- Merge only when CI is green. If CI fails, fix it on the same branch.
- The executor runs `npm run lint && npm test && npm run build` itself only if it can. CI is the authority either way. The Result block says which checks the executor ran itself.
- If the executor cannot open a pull request, the owner taps "Compare & pull request" on GitHub.

## Surviving a usage limit mid-chat

- Every chat starts with a bootstrap line (below). Nothing is assumed from earlier chats.
- Commit small and often. Work not yet committed dies with the chat; committed work does not.
- The first commit on `wip/NNN` sets the card to `in progress`. Every commit updates the card's Progress line (done, left, next action).
- On the word "handoff", or when a chat gets long, the AI updates Progress first, then gives a paste block of at most 10 lines.
- The next AI reads `PROJECT_STATE.md`, then the card, then lists branches to find any `wip/NNN` and its open pull request.

## Cost rules

- A card is one outcome, ideally 5 files or fewer.
- Read only the files the card names. For large files, read only the needed line range.
- Never paste files into chat. Refer to paths, pull request numbers and commit SHAs.
- Report the pull request number or commit SHA and a one-line summary, not the full diff.
- Claude plans and reviews; ChatGPT types. Put the design in the card so the executor does not guess.
- Skip Claude's review for small, low-risk cards. CI is enough there.
- Large files (`GuideView.tsx`, `cardSlice.ts`) are expensive through the GitHub tool, which resends whole files. Keep such cards to one file where possible.

## Bootstrap lines

- Any AI: `Repo KarlMuzen/RoleplayForge. Read PROJECT_STATE.md, then docs/AI_WORKFLOW.md. Continue the Current task.`
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
