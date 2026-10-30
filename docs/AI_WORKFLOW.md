# AI workflow (FINAL)

Final since 2026-10-30. Only the owner changes this file, by saying "change workflow". Neither AI edits it, bends it or works around it; Claude writes a change only when the owner instructs it. If a rule blocks the work, the AI stops and names the rule. Changes: 2026-10-30 Argon 4 advisor added; 2026-10-30 owner as tester and planner, test reports, advisor pre-flight, `main` SHA in handoffs.

## Jobs

| | Owner | Claude | ChatGPT | Argon 4 (advisor) |
|---|---|---|---|---|
| Is | Sets goals and plans. Tests on the phone. Decides. Non-technical. | Architect, designer, card writer, researcher. Reviews Argon's claims, ChatGPT's diffs and the owner's test reports. | Executor | Outside researcher and second opinion. Read-only. Browses raw files only. |
| Writes | Nothing technical. Says the trigger phrases and sends test reports. | Docs only: `PROJECT_STATE.md` (sole writer), task cards, `docs/research/`, `docs/*`. Never bulk code. | Code, tests, branches, pull requests, its own card's Progress and Result | Nothing in the repo. Gives the owner written findings. |
| Never | Is asked to paste code or summaries | Edits app code (except "Minor direct commits") | Redesigns, changes scope, decides, edits `PROJECT_STATE.md`, this file, other cards or research | Commits, branches, cards, merges, edits any file, decides, or has a claim treated as fact before Claude verifies it |

## Truth

1. The repo is the only source. Chat history is disposable. Read it with `git clone` or `git fetch`, not web pages.
2. Authority, highest first: the owner's latest explicit instruction, this file (process), `PROJECT_STATE.md` (state and product decisions), the task card (the task), everything else. On a conflict the AI stops and flags it. It does not guess.
3. Before any write (commit, branch, card number) fetch `origin`, confirm the `main` head, list open pull requests. If the repo holds work you did not expect (a card another chat wrote, an open PR), stop and report. Never duplicate it.
4. A feature is unimplemented until code and evidence exist.

## Advisor (Argon 4)

Added 2026-10-30 on the owner's instruction. Argon 4 is an outside researcher and second opinion. It is not a third executor and not a gate.

1. It is read-only. Its findings reach the repo only through Claude. Pasted advisor text is an idea or a problem like any other (see Owner phrases); no new phrase is needed.
2. Claude checks each claim that names a file, line, number or behavior against the repo or the primary source before using it (Decision 26). Each claim is marked verified, wrong or unverified. Only verified findings enter the repo: a task card, the Known bugs list, or `docs/research/`. Wrong claims that are likely to come back are listed in the research cross-check so they are not re-proposed.
3. The advisor must state the `main` SHA it read and read every file at that same SHA. A finding is checked again against current `main` before it counts. (Its first review compared `PROJECT_STATE.md` at `f4d4310` with `docs/tasks/` from a later commit.)
4. Order of checking, to save cost: data loss, privacy and security claims first; claims with a file and line next; style and taste last, answered in one line. Claude does not rewrite its plan because an advisor disagrees; it records the disagreement and the evidence, and the owner decides.
5. The advisor never replaces `Review: required`. Claude's diff review stays the gate (the section Gate below). The owner may ask the advisor for an audit of merged `main` now and then, about every 4 to 5 merged cards.
6. The advisor does not see secrets and is never asked to paste code into the repo. Its suggested code is a hint for Claude, not a patch.
7. Browse-only limits. The advisor has no terminal. It can only open raw files at `https://raw.githubusercontent.com/KarlMuzen/RoleplayForge/<SHA>/<path>`. The owner gives it the `main` SHA and exact paths each session; the handoff block carries the SHA. It cannot search or list folders, so it never claims that something is unused or missing; it writes "not seen in the files I read" and lists those files. Claude's checks (item 2) do the searching.
8. Pre-flight (optional, for `Review: required` cards). Before `Execute`, the owner may send the card path and the SHA to the advisor. It checks that every file, function and line the card names exists at that SHA and reports mismatches. Claude fixes the card. This is a check on the card, not a gate; the executor's stop rule (below) stays.

Standing prompt for the advisor (the owner pastes it once into that chat):

> You are a read-only reviewer for KarlMuzen/RoleplayForge. State the `main` SHA you read. For each finding give: file path and line, what you saw, whether you verified it by reading or inferred it, and the impact (data loss, privacy, security, UX). No code patches, no new features, no rewrites. Do not invent files or APIs; if unsure, say "I don't know". Output: Answer, Evidence, Risks and unknowns, one suggested next step. Respect the frozen identifiers and decisions in `PROJECT_STATE.md`; if you disagree with a decision, ask it as a question. You can only open raw files at the SHA the owner gives you and cannot search: never claim something is unused or missing; say "not seen in the files I read".

## Owner phrases (the whole vocabulary)

- `Execute docs/tasks/NNN-name.md` (ChatGPT)
- `Review docs/tasks/NNN-name.md` (Claude)
- `sync` (Claude refreshes `PROJECT_STATE.md` from merged and open PRs)
- `handoff` (the current AI updates Progress, or for Claude the Current task, then gives a paste block of at most 10 lines: goal, current task, open PR, next action, `main` SHA)
- `change workflow` (the only way this file changes)
- Anything else said to Claude is an idea or a problem. Claude plans; it does not code.

## Owner test reports

Format: pass or fail, the card number, and on a fail one screenshot and one line on what was expected. Claude turns each fail into a card or a Known bugs entry. Chat history is not the record. A test report never blocks a merge (see Gate).

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

The card is unclear or conflicts with the repo; the change needs a file under "Do not touch"; it touches a frozen identifier; it needs a new dependency; CI is red after 2 fixes; the change grows 2 or more files past the card's list. A card that names a file, function, line or screen the code does not have is a conflict with the repo (Task 029 named a Library single export that did not exist). It never improvises.

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
