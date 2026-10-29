# Task 019: Chat text formatting in the SillyTavern way

Status: in progress
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
Done: Verified updated `main` at `01ab1a5eafab3ff239f5b378dd75173ef9c0eda8`; Task 018 is merged. Created `wip/019`.
Left: Implement the pure formatter/parser, wire only the specified render function and user-message call site, add the no-DOM tests.
Next action: Write the parser from the task-card rules only, then run CI and request Claude review.

## Result (executor, when finished)
Pull request:
Checks run by executor:
CI:
Preview link: n/a (Decision 19)
Deviations from the card:

## Review (Claude, required)
Pending
