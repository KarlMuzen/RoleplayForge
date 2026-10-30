# Research 002: Argon strategy claims (format wars, slop, cast studio, badge, WebLLM)

Verified by Claude on 2026-10-30, `main` at `3d5b8bc`. Source of the claims: an Argon 4 strategy export pasted by the owner (Decision 26: outside research is not a source). Findings only; no decisions. Primary sources: code in this repo, research 001, arXiv 2510.15061, web.dev (Chrome team).

## Verdicts

| # | Claim | Verdict | Source | Notes |
|---|---|---|---|---|
| 1 | PNG cards are hitting technical limits (base64 in one chunk) | Unverified | research 001, claim 10 | No size-limit evidence found. Verified instead: the spec discourages asset chunks in PNG, so a PNG cannot carry the full asset set. |
| 2 | The community is moving to CHARX archives | Partly | research 001, claim 10 | CHARX structure verified. Adoption is unverified. SillyTavern has CHARX import only (no export found). |
| 3 | A creator can drop in a RisuAI `.charx` or an Agnai JSON card | Partly | `docs/PLATFORM_SUPPORT.md`, `src/` | CHARX is an implemented path. No Agnai card import exists; Agnai appears only in a comment in `src/utils/normalizeLorebook.ts` and in `GuideView.tsx` (see `docs/BUGS.md`). |
| 4 | A Compatibility Center is planned | Verified | `docs/PRODUCT_VISION.md` item 7; `docs/ROADMAP.md` Priority 3 | Receipts and dated adapter status are card 023. |
| 5 | Slop phrases are far more frequent than in human text, and fingerprints differ between model families | Verified | arXiv 2510.15061 (Antislop, ICLR 2026) | Some patterns over 1,000x more frequent; fingerprints cluster within a family and differ between families; token banning stops working at about 2,000 patterns. |
| 6 | Argon's example phrases and which model triggers which | Unverified | arXiv 2510.15061 | The paper's own examples differ (names such as "Elara", "voice barely above a whisper", "it's not just X, it's Y"). "Forgetting asterisks vs quotes" per model is unverified. |
| 7 | A pattern in a First Message triggers the same pattern in that model's replies | Unverified | none | Plausible, no evidence found. |
| 8 | The repo already has slop or model-target rules | Wrong (not present) | `src/utils/writingLint.ts` | 13 rule ids, none for slop. The only model-related rule is `model_compatibility_prompt_hint` (info, about bypass instructions). |
| 9 | A Multi-Lorebook Composer exists in the Lorebook tab | Verified | `src/components/LorebookView.tsx` | Tabs: collisions, shadowed, simulation. It stacks lorebooks. Nothing works across cards and there is no Project concept. Group Preview is in `ChatPreviewModal.tsx` (Decision 18). |
| 10 | No tool on the market does cross-card context debugging | Unverified | none | An absolute market claim; cannot be verified here. |
| 11 | Example: two cards with a "Tavern" trigger cause a 2,000-token spike | Unverified (invented) | `docs/ROADMAP.md` card 024 | The measured case is Chub Helper: 6 entries = 1922 tokens against a budget of 1200. |
| 12 | Group chat is the next wave for creators | Unverified | none | Opinion. How SillyTavern merges lorebooks in group chats is not researched (open item 1). |
| 13 | A "Crucible Score" out of 100 exists | Wrong (not present) | `src/components/crucible/DiagnosticScorePanel.tsx` | `DiagnosticScores` has `agendaHeld`, `tellConsistency`, `openerQuality`, `loreDelivery`, `driftOnsetTurn`, `reasoning`, judged by an LLM (scale not checked). `VariantComparisonPanel.tsx` shows pass rates in percent. |
| 14 | The Pre-Flight Audit works offline | Verified | `src/components/PreFlightAuditModal.tsx` | No network or provider call found in the modal (searched for fetch, adapter and provider calls). Rules come from `writingLint.ts`. |
| 15 | A shareable badge is free viral marketing | Unverified | none | Opinion. A score label also conflicts with the honest-evaluation rule in `docs/PRODUCT_VISION.md`. |
| 16 | Token numbers are ready to publish on a spec sheet | Wrong for now | `docs/ROADMAP.md` "Details accuracy" | The Details headline (1408) is 210 above its chips (1198); Decision 9 requires the breakdown to sum to the headline. |
| 17 | WebGPU is available on phones | Partly | web.dev, "WebGPU is now supported in major browsers" (2025-11-25) | Chrome on Android from version 121, only on Android 12 or newer with Qualcomm or ARM GPUs; Safari on iOS 26. Not every phone. |
| 18 | WebLLM needs WebGPU with no CPU fallback; Llama-3.2-1B q4f16 needs about 879 MB VRAM and the `shader-f16` feature | Unverified at the primary | a dev.to article quoting WebLLM `src/config.ts` | WebLLM's own config was not read. The catalogue changes per release. |
| 19 | Llama-3.2-1B and Qwen2.5-1.5B are WebLLM prebuilt models, about 0.7 to 1.1 GB | Unverified at the primary | several third-party projects | Sizes differ between sources. |
| 20 | Testing lorebook triggers needs a paid model | Wrong as stated | `docs/ROADMAP.md` Priority 4; research 001 claim 2 | Key matching is code, not a model. The planned activation simulator covers it after its rules are checked against SillyTavern (open item 2). |
| 21 | A 1B or 3B browser model can show that persona traits and prompts hold | Unverified | none | No evidence found. |

## Suggestions (not decisions; card numbers are in `docs/ROADMAP.md`)

- Slop rules fit the linter (card 022) as suggestion-level rules with a sourced, dated phrase list. Per-model profiles wait for evidence from real model output.
- A spec sheet should list facts only: token estimates with the tokenizer named, lint results with rule version and date, lorebook budget numbers. It waits for the token headline fix.
- A cross-card check waits for the activation simulator (Priority 4) and the group-chat research.
- WebLLM waits until Priority 4 is done. It would be a new dependency and an opt-in download behind capability detection.

## Open items (look up next)

1. How SillyTavern combines card lorebooks and World Info in group chats.
2. SillyTavern lorebook matching rules for the simulator (already listed in `docs/ROADMAP.md` Priority 4).
3. WebLLM `src/config.ts` and its README, read directly, before any WebLLM card.
4. A real Agnai card file, only if the owner wants Agnai support.
