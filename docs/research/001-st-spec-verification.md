# Research 001: SillyTavern and card spec verification

Date: 2026-10-30. Author: Claude (read from source, not from memory or blogs).
Purpose: verify the "Verified Quirks" before cards 021-025 are built on them.

Sources read:
- SillyTavern (ST) `release` branch, v1.19.0, commit `06bde93` (2026-09-14). `staging` also reports 1.19.0; not diffed.
- `kwaroran/character-card-spec-v3`, `SPEC_V3.md`
- `malfoyslastname/character-card-spec-v2`, `spec_v2.md`
- RisuAI `main`, cloned 2026-10-30 (commit not recorded)

Status: findings only. No decision is made here. Decisions go to PROJECT_STATE.md.

## Verdicts

| # | Claim | Verdict | Source | Notes |
|---|---|---|---|---|
| 1 | ST standalone lorebook: `entries` is an object keyed by id; `key` / `keysecondary` | Verified | ST `public/scripts/world-info.js` `convertCharacterBook` (~L5617); `src/endpoints/characters.js` `convertWorldInfoToCharacterBook` (~L659) | Differences from CCv2 listed below. |
| 2 | Over budget, higher `order` survives; low numbers dropped first | Verified | `world-info.js` L88 `sortFn = b.order - a.order`; budget loop ~L5017-5070 | After the first entry overflows, everything lower is dropped (no skipping to fit small entries). Sticky entries sort first. Sort unchanged since the repo's first commit (2023-07-20). Budget loop history not diffed. |
| 3 | CCv3 decorators; ST maps `@@depth` to `extensions.depth` + position 4 | Partly | `SPEC_V3.md` "Decorators"; ST `world-info.js` L100 `KNOWN_DECORATORS`, L4648 `parseDecorators`; `world_info_position` L855 | Spec defines 20 decorators. ST knows only `@@activate` and `@@dont_activate`. No `@@depth` mapping exists in ST. "At depth" = position 4 and default depth = 4: confirmed. |
| 4 | `embeded://` (one d) in spec; who accepts `embedded://` | Partly | `SPEC_V3.md` CHARX and `assets` sections; ST `src/charx.js` L9-10; RisuAI `src/ts/characterCards.ts` L911, L1496 | Spec says `embeded://` and "Not `embedded://`". ST accepts `embeded://`, `embedded://`, `__asset:`. RisuAI reads and writes only `embeded://` in the paths read. Chub: Could not verify (closed source). |
| 5 | Which PNG chunk is read first when both exist | Verified (ST, Risu) | ST `src/character-card-parser.js` L50-77; Risu `characterCards.ts` L307-313; spec "PNG/APNG" | Both read `ccv3` first. Spec says SHOULD use `ccv3`. Chub: Could not verify. |
| 6 | PNG base64 must decode as UTF-8 | Verified | Spec V3 "PNG/APNG"; ST parser L28, L67 | V3 spec requires UTF-8 then base64. ST decodes as UTF-8. `spec_v2.md` does not describe PNG encoding. |
| 7 | `#` or `[` are default stop sequences | **Wrong** | ST `public/script.js` L3025 `getStoppingStrings`; `power-user.js` L298; `instruct-mode.js` L301 | ST defaults: `\nName:` strings, instruct-preset sequences, user custom list (empty by default). Chat Completion uses only the custom list. KoboldCpp and other backends: Could not verify. |
| 8 | Empty CCv2 `personality` allowed; ST loads it | Verified | `spec_v2.md` L36; ST `characters.js` L582, L600 | Spec requires a string, does not forbid empty. ST uses `|| ''`. |
| 9 | ST-only lorebook fields and where stored | Verified | `world-info.js` L2687 `originalWIDataKeyMap` | List below. |
| 10 | CHARX structure; what is kept or lost to PNG | Partly | `SPEC_V3.md` CHARX; ST `charx.js`, `characters.js` L765 | Structure verified. Kept/lost verified for ST import only. |

## Detail: claim 1 (ST standalone vs CCv2 `character_book`)

- Entries: object keyed by `uid`, not an array.
- Renames: `key` to `keys`, `keysecondary` to `secondary_keys`, `order` to `insertion_order`, `uid` to `id`.
- `disable` is the inverse of `enabled`.
- Position is a number 0-7 in ST. On card export it becomes `before_char` / `after_char` plus `extensions.position` (number).
- ST export hard-codes `use_regex: true`. CCv2 has no `use_regex`; it is a V3 field.
- ST has `addMemo` (derived from `comment`); the card format does not.
- Book-level `name`, `description`, `scan_depth`, `token_budget`, `recursive_scanning` are not in the standalone file. ST uses global settings for budget.
- On import from a card, ST ignores top-level `use_regex`, `priority`, `name` and `case_sensitive`. It reads `case_sensitive` only from `extensions.case_sensitive`.
- Unverified: ST's own key map puts `selectiveLogic` at the entry top level, but export writes it under `extensions`. Needs a real exported file.

## Detail: claim 9 (ST-only entry fields, all stored in `extensions.*` on card export)

- Placement and probability: `depth`, `role`, `probability`, `useProbability`, `position` (number), `outlet_name`, `display_index`
- Recursion: `exclude_recursion`, `prevent_recursion`, `delay_until_recursion`
- Logic: `selectiveLogic`
- Groups: `group`, `group_override`, `group_weight`, `use_group_scoring`
- Matching: `scan_depth`, `match_whole_words`, `case_sensitive`, `match_persona_description`, `match_character_description`, `match_character_personality`, `match_character_depth_prompt`, `match_scenario`, `match_creator_notes`
- Timing: `sticky`, `cooldown`, `delay`
- Other: `automation_id`, `vectorized`, `triggers`, `ignore_budget`

## Detail: claim 10 (CHARX)

- Zip file with `card.json` at the root; assets under `assets/{type}/...` (spec).
- ST has CHARX import only. No CHARX export found in ST code.
- ST import: main icon becomes the PNG avatar. `emotion` / `expression` images go to sprites, `background` to a backgrounds folder, other images to misc. Only image extensions are kept (png, jpg, jpeg, webp, gif, apng, avif, bmp, jfif).
- Dropped by ST: audio, video, 3D, code and other non-image assets; extra `icon` and `user_icon` assets.
- Spec's optional PNG asset chunks (`chara-ext-asset_`) are discouraged, so a PNG cannot carry the full asset set.

## Other findings

- ST writes both `chara` and `ccv3` chunks on every PNG save (`character-card-parser.js` L10-45). The `ccv3` chunk is the V2 JSON with `spec` / `spec_version` overwritten, so it lacks V3-only fields. The code comment above the function says only `chara` is written; the code does both.
- ST strips leading `@@` lines from entry content (known and unknown) and acts only on `@@activate` / `@@dont_activate`. Unknown decorators do not leak into the prompt in ST. Other frontends: not checked.
- CCv3 spec on budget: lowest `insertion_order` may be removed first when `priority` is absent (same direction as ST). CCv2 spec: lower `priority` is discarded first; ST does not read `priority`.
- ST budget counts already-scanned text tokens plus new entry content against the budget (default 25% of context, optional cap).
- Alpaca instruct preset has `sequences_as_stop_strings: true` and the sequence `### Instruction:`. A card containing that exact text can truncate output in text-completion mode.

## Things we probably believed that are wrong

1. `#` / `[` stop-sequence hazard: not an ST default. Real hazard is instruct-preset sequences.
2. "ST maps `@@depth` to `extensions.depth` and position 4": ST does not do this.
3. Dual-chunk desync is not an ST problem: ST rewrites both. But its `ccv3` chunk is V2 data labeled V3.
4. `embedded://` must not be accepted: ST accepts both spellings. Write `embeded://`; read both.
5. V3 lorebook fields `use_regex`, `priority`, `name`, top-level `case_sensitive` are ignored by ST on import.

## Suggestions (not decisions; card numbers are in `docs/ROADMAP.md`, "Next cards")

- Receipts card: treat `@@depth N` to `extensions.depth=N, position=4` as our own lossy conversion. Log it in the receipt. Keep the original decorator lines for round trips.
- Reading code accepts `embeded://` and `embedded://`. Writing code uses `embeded://`.
- Linter card: replace the `#` / `[` rule with "card text contains an instruct-preset marker such as `### Instruction:`" at low severity, or drop it until backends are checked.
- CHARX to PNG receipts list every dropped asset by type.
- Lorebook budget card: word the rank-1 warning as "low order drops first when the budget is hit; it stops at the first overflow".

## Open items (look up next)

1. Real exported ST lorebook and card JSON files as test fixtures; settles the `selectiveLogic` location.
2. Chub PNG chunk and decorator handling (closed source; test with real files).
3. Default stop strings in KoboldCpp, text-generation-webui and other backends.
4. How the ST budget loop and `ignoreBudget` changed across versions.
5. RisuAI decorator support and any `embedded://` handling elsewhere in its code.

## Cross-check of the AI Studio blueprint (Claude, 2026-10-30)

The owner's AI Studio export ("Master Architectural Blueprint") was checked against this note and the code. It is not a source; it is not stored in the repo. Verdicts:

- Mojibake from `atob()`: not present. `base64ToUtf8` (`src/utils/binaryEncoding.ts`) decodes as UTF-8 in both the Node and browser branch. No test covers it yet (added in Task 021).
- ST standalone lorebook (dict, `key`/`keysecondary`): `normalizeLorebook` converts it, but `importCardData` never routes such a file to it. Reproduced 2026-10-30: the Lorebook screen import does nothing. Task 021.
- `@@depth` mapping, `#`/`[` stop sequences, dual-chunk desync as an ST problem: wrong or partly wrong, see the verdict table above. Not adopted.
- Rank-1 lorebook: verified (claim 2). Wording must follow the Suggestions above.
- Linter list: the repo's `writingLint.ts` already has godmoding, missing `<START>`, unmatched brackets and hard-coded names. Not verified: `{{Char}}` capital letters as an error (ST macro case rule not read), "negative prompting paradox", Author's-Note position mismatch, the 2,000-token threshold. Verified and cheap: invisible characters and curly quotes in lorebook keys; `{ { char } }` and single-brace `{user}`.
- "4 of 5 top cards leave personality empty" and "620-entry lorebook freezes the phone": not verified. The repo has no entry-list paging (`LorebookView.tsx`); measure with a 600-entry fixture before changing.
- Brand block (Anvil & Quill, vellum/terracotta palette): conflicts with the shipped Forge logo and the status colors set on 2026-10-29 (PROJECT_STATE Decision 23). Not adopted.
- Receipts as "cryptographic SHA-256": not needed; a receipt is a list of preserved, transformed, unsupported and dropped fields.
- Open decision found: on duplicate PNG text chunks the repo (`pickBestDuplicateCandidate`, `src/io/png.ts`) prefers the chunk with `character_book`, else the longer JSON; ST and RisuAI read `ccv3` first (claim 5). Needs real fixtures before changing.
