# AI workflow

Two AIs, one repo. The repo is the source of truth. Chat history is disposable: if a chat hits a usage limit, nothing may be lost.

## Roles

| | Claude | ChatGPT |
|---|---|---|
| Job | Architect, designer, reviewer | Executor |
| Writes | Decisions, task cards, reviews, docs | Code, tests, commits |
| Does not | Write bulk code | Redesign, change scope, make decisions |
| Owns in `PROJECT_STATE.md` | Goal, Structure, Decisions, Next steps, Guardrails | Current task, In progress, Done, Known bugs |

Each AI edits only its own sections. Re-read `PROJECT_STATE.md` right before editing it, because a commit overwrites the whole file.

The owner passes only a task number or a bootstrap line, never pasted code or summaries.

## Loop

1. **Plan (Claude).** Owner states a goal. Claude reads the repo, records decisions in `PROJECT_STATE.md`, commits a task card `docs/tasks/NNN-name.md`.
2. **Execute (ChatGPT).** Owner says "Execute docs/tasks/NNN-name.md". ChatGPT does exactly what the card says and fills in Progress and Result.
3. **Review (Claude).** Owner says "Review docs/tasks/NNN-name.md". Claude reads the commit diff from the repo and writes Approved or Changes needed in the card. Changes become a new card, not chat instructions.

If a card is unclear, conflicts with the repo, or needs a decision, the executor stops and says so in one message. It does not improvise.

## Surviving a usage limit mid-chat

- Every chat starts with a bootstrap line (below). Nothing is assumed from earlier chats.
- Commit small and often. Work not yet committed dies with the chat; committed work does not.
- A task that fits one commit goes straight to `main` after lint, test and build pass.
- A larger task goes on branch `wip/NNN`. The first commit sets the card to `in progress`. Every commit updates the card's Progress line (done, left, next action). Merge to `main` only when lint, test and build pass. Never leave `main` broken.
- On the word "handoff", or when a chat gets long, the AI updates Progress first, then gives a paste block of at most 10 lines.
- The next AI reads `PROJECT_STATE.md`, then the card, then lists branches to find any `wip/NNN`.

## Cost rules

- A card is one outcome, one commit, ideally 5 files or fewer.
- Read only the files the card names. For large files, read only the needed line range.
- Never paste files into chat. Refer to paths and commit SHAs.
- If an AI committed a change, report the commit SHA and a one-line summary, not the full diff.
- Claude plans and reviews; ChatGPT types. Put design in the card so the executor does not guess.
- Edit large files (`GuideView.tsx`, `cardSlice.ts`) from a local clone when possible. The GitHub tool resends whole files.

## If the executor cannot write to GitHub or run commands

It outputs a ready-to-apply diff, states which checks were not run, and the owner commits. The card's Result says "checks not run".

## Bootstrap lines

- Any AI: `Repo KarlMuzen/RoleplayForge. Read PROJECT_STATE.md, then docs/AI_WORKFLOW.md. Continue the Current task.`
- Executor: `Execute docs/tasks/NNN-name.md.`
- Reviewer: `Review docs/tasks/NNN-name.md.`

## Rules for both AIs

- Verify the `main` head before every commit.
- Respect the frozen identifiers listed in `PROJECT_STATE.md`.
- Do not contradict existing repo work. Flag conflicts first.
- Never invent APIs or packages. Say "I don't know" when unsure.
- Plain language. The owner is non-technical.

## Task card template

Save as `docs/tasks/NNN-name.md`.

```
# Task NNN: <title>

Status: planned | in progress | done | changes needed
Goal: <one sentence>
Files to touch: <exact paths>
Do not touch: <paths or areas>
Changes: <precise steps; code only where the design depends on it>
Done when: <commands that must pass + what the owner can see>
Decisions: <PROJECT_STATE.md decision numbers this relies on>

## Progress (executor, update every commit)
Done: 
Left: 
Next action: 

## Result (executor, when finished)
Commit: 
Checks run: 
Deviations from the card: 

## Review (Claude)
Approved | Changes needed: <list>
```
