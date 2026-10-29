# Task 019: Chat text formatting in the SillyTavern way

Status: done
Review: required
Goal: Chat messages (card and user) show `*actions*`, `**bold**`, `~~strike~~` and `` `code` `` correctly, and broken or half-finished asterisks no longer show as stray `*` characters. Behavior follows SillyTavern's chat display, written from scratch.
Files to touch: new `src/core/chatMarkup.ts`; `src/components/ChatPreviewModal.tsx` (only `renderRoleplayText` and its one call site); new `test/chatMarkup.test.ts`.
Do not touch: the store, `conversationEngine.ts`, the Crucible views, prompts sent to the AI, stored message text, any other file, frozen identifiers. No new npm package. No `innerHTML`, no `dangerouslySetInnerHTML`.
Context: owner phone screenshots (2026-10-29) of the Chub Helper greeting show a literal `*` before "Use V2 Spec." and another at the end, because `renderRoleplayText` splits on `/(\*[^*]+\*)/`, which cannot handle `**`, unbalanced `*`, or text across lines (known bug in `PROJECT_STATE.md`). The raw greeting text is not in the repo, so the exact cause is a guess; the tests below cover each likely shape. SillyTavern, read from `public/script.js` (`messageFormatting`) and `public/scripts/power-user.js` (`fixMarkdown`) on 2026-10-29: it runs a full Markdown converter (showdown) with single newline = line break, strikethrough, underline and tables on; it wraps `"quoted text"` in a styled element; its "Auto-fix markdown" setting is on by default, works on display only, trims spaces just inside `*` pairs, and adds a missing `*` to lines with an odd count.
LICENSE WARNING: SillyTavern is AGPL-3.0. This repo is MIT. Do NOT copy, paste or translate SillyTavern code. Implement the rules below from this card only. Do not open SillyTavern files while writing the code.
Design (the whole spec; do not improvise):
1. `src/core/chatMarkup.ts` exports pure functions, no React, no DOM:
   - `fixChatMarkup(text: string): string`, display-only cleanup, applied line by line (split on `\n`): for each `*` or `**` pair on the line, remove spaces just inside the markers: `* word *` becomes `*word*`, `** word **` becomes `**word**`. Lines inside a fenced block (a line starting with three backticks, until the next such line) are left alone. Nothing else.
   - `parseChatMarkup(text: string): ChatToken[]` where `ChatToken = { type: 'text' | 'italic' | 'bold' | 'strike' | 'code'; text: string; children?: ChatToken[] }`. Newlines stay as `text` tokens containing `\n`.
2. Parsing rules, per line, left to right:
   - `**x**` is bold, `*x*` is italic, `~~x~~` is strike, `` `x` `` is code (code content is never parsed further).
   - An opening marker must be followed by a non-space character; a closing marker must be preceded by a non-space character. A marker that is neither (for example `a * b`) is plain text.
   - A marker pairs only with the next matching marker on the same line. Content must not be empty.
   - Unpaired marker, opener: if text follows it on the line, the span runs to the end of the line (implicit close). Unpaired marker, closer: if it ends the line and text precedes it, the span starts at the start of the line.
   - Bold, italic and strike content is parsed again (so `**bold *and italic***` and `*an **ugly** case*` both nest). Maximum nesting depth 3; deeper text stays plain.
   - Underscore markers (`_x_`, `__x__`) are NOT supported (snake_case would break). No headings, lists, tables, images, links, HTML, emoji codes.
   - HTML-like text such as `<b>` is shown as plain text, because tokens are rendered as React text.
3. In `ChatPreviewModal.tsx`, `renderRoleplayText(text)` calls `parseChatMarkup(fixChatMarkup(text))` and maps tokens to elements: italic keeps today's classes (`<em className="text-amber-300/90 not-italic italic font-serif opacity-90">`), bold `<strong className="font-semibold">`, strike `<s>`, code `<code className="rounded bg-black/20 px-1 font-mono text-[0.9em]">`, text `<span>`. Keep `whitespace-pre-wrap` on the bubble, so single newlines stay line breaks.
4. User messages use the same function (replace `isUser ? m.text : renderRoleplayText(m.text)` with the single call). The message edit box and stored text stay raw.
5. The stored message, the text sent to the AI, copy, and edit all use the raw text. Only the display changes.
Tests (`test/chatMarkup.test.ts`, vitest, no DOM). Each case: input, then expected tokens (type and text only, newline tokens included where specified):
   - `*waves* hello` gives italic "waves", text " hello".
   - `**bold**` gives bold "bold".
   - `* spaced *` gives italic "spaced".
   - `She says *hello` gives text "She says ", italic "hello".
   - `close*` gives italic "close".
   - `a * b` gives one text token "a * b".
   - `**Use V2 Spec. (Menu > Configuration)` (the screenshot shape) gives one bold token and no `*` anywhere in the output.
   - `*a*\n*b*` gives italic "a", newline, italic "b".
   - `*open\nclose*` gives italic "open", newline, italic "close" (each line on its own).
   - `` `*not italic*` `` gives one code token with text `*not italic*`.
   - `~~gone~~` gives strike "gone".
   - `**bold *and italic***` gives bold containing italic.
   - `snake_case_word` and `a_b_c` stay one plain text token.
   - `<b>x</b>` gives one plain text token with the angle brackets intact.
   - Empty string gives an empty array.
   - Lines inside a fenced block are not changed by `fixChatMarkup`.
Not in this card (decide later, after an owner phone check): coloring of `"quoted dialogue"` (SillyTavern does; it needs a theme-safe color for dark and light), underline, tables, lists, a Settings toggle for auto-fix, applying the formatter to the Details preview of greetings.
Done when: CI green; Claude's review is Approved (one diff read, plus a check that no SillyTavern code was copied). Owner, phone: open the Chub Helper card chat; no stray `*` in the greeting, actions show in the amber serif style, a typed `**bold**` and `*action*` show formatted in the sent bubble.
Decisions: 2 (pure logic in `src/core/`), 18 (chat is a card test bench).

## Progress (executor, update every commit)
Done: Applied Claude's requested parser fix in commit `06db68cb9c823e25243ad6a3f9ca04c997971c15`, added both regression tests in `e43b1c5d89fc9927c4a04ce75ebde6791596d497`, and incorporated Claude's approval on PR head `1e41fcd538226aae4cc53b0cacacc231343b3e87`. PR #21 was squash-merged as `7528c5b730b7f0380a74f1a3ff6fe6c4653dba18`. PR `test-and-lint` passed on the reviewed head (run 40880061957), and main CI passed on the merge commit (run 40880576785). Vercel production deployment `dpl_27gVbugEcdYErUDwUqS1XzLthH6x` is READY for the exact merge SHA, with alias `roleplayforge.vercel.app`.
Left: Owner phone check after merge (not a merge gate; Decision 17).
Next action: Owner checks chat formatting in the Chub Helper card chat when convenient.

## Result (executor, when finished)
Pull request: https://github.com/KarlMuzen/RoleplayForge/pull/21
Merge commit: https://github.com/KarlMuzen/RoleplayForge/commit/7528c5b730b7f0380a74f1a3ff6fe6c4653dba18
Checks run by executor: Not run locally; GitHub Actions is authoritative.
CI: Passed `test-and-lint` on reviewed PR head `1e41fcd538226aae4cc53b0cacacc231343b3e87` (run 40880061957). CI also passed on the merge commit on `main` (run 40880576785).
Production: READY deployment `dpl_27gVbugEcdYErUDwUqS1XzLthH6x`, built from merge commit `7528c5b730b7f0380a74f1a3ff6fe6c4653dba18`. The `roleplayforge.vercel.app` alias is assigned to it. No manual recovery deployment was needed.
Preview link: n/a (Decision 19; production deployment verified instead).
Deviations from the card: None. The parser fix and both requested regression tests passed; Claude approved the fix.

## Review (Claude, required)
Changes needed (reviewed head `3299effa5bbe9c916eaeb29dc086347c876e2dff`, 2026-10-29). Fix on the same branch `wip/019`, same PR #21, then report. Do not merge until Claude re-checks the fix commit.

1. Crash bug in `src/core/chatMarkup.ts`, function `parseSegment`, the branch commented "A terminal unmatched closer wraps the line's preceding text". `previousTokens` is set to `tokens` (the same array), then `tokens.length = 0` empties it, then the new token is pushed with `children: previousTokens`. The token's `children` is the array that contains the token itself, a circular reference. `renderTokens` in `ChatPreviewModal.tsx` then recurses forever and the chat view crashes. Reproduced locally on the PR head: `**bold** text**` and `Hi *there* friend**` both produce a cycle. Any line with a finished span followed by a lone closing marker at the end of the line triggers it.
   Fix: copy the array before clearing it: `const previousTokens = containsFormatting(tokens) ? [...tokens] : undefined;`. Nothing else in this branch changes.
2. Add two tests to `test/chatMarkup.test.ts`, both on `parseDisplayText`:
   - `**bold** text**`: assert `JSON.stringify(tokens)` does not throw, and the result is one bold token whose `children` are bold "bold" and text " text".
   - `Hi *there* friend**`: assert `JSON.stringify(tokens)` does not throw, and the result is one bold token whose `children` are text "Hi ", italic "there", text " friend".
   If the real output differs from these shapes but has no cycle, report the real shape in Result instead of changing the parser further.

Checked and fine: no SillyTavern code copied (own recursive parser, own names and structure, no showdown or `fixMarkdown` logic); only the allowed files are touched; stored text, AI input, copy and edit still use raw text; tokens render as React elements, no `innerHTML`; the Chub greeting shape `**Use V2 Spec. (Menu > Configuration)` renders as bold with no stray `*`.

Not blocking, no change now: `2 * 3 * 4` displays as `2 *3* 4` with "3" in italics, because the card's own `fixChatMarkup` rule trims spaces inside any `*` pair (SillyTavern's auto-fix behaves the same way). Claude decides later whether to restrict it.

Re-check (2026-10-29, head `7430c558cca8d272553078a19ec452ba4ce36d95`): **Approved.** Fix `06db68c` copies the array before it is cleared; no cycle remains. Both regression tests (`e43b1c5`) pass with the shapes asked for. Verified on a clean checkout: 22 tests in `test/chatMarkup.test.ts` pass, lint has 0 errors, and a 200,000-input random fuzz run (markers, spaces, newlines, fences) produced no circular token, no exception and no nesting deeper than the limit. Only the three allowed files plus this card changed since the first review. Merge on green CI (Decision 19). Owner phone check after merge, as in Done when.
