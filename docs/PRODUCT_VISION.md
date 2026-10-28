# Roleplay Forge: Product Vision

## Mission

Build one local-first AI roleplay workbench where creators can author, organize, configure, validate, compare and test roleplay assets without losing important data when moving between supported formats and platforms.

Roleplay Forge is an authoring and testing workspace, not a replacement for every roleplay frontend. It helps users prepare assets and understand their behavior in target runtimes.

## Shared workspace

1. **Library** — character cards, lorebooks, variants, assets and future preset collections.
2. **Card Studio** — field-aware authoring, structured AI edits, consistency checks and format validation.
3. **Lorebook Studio** — entry authoring, activation simulation, overlap/recursion review and token-budget inspection.
4. **Preset Workshop** — versioned generation settings, provider/model compatibility and explicit mapping of portable versus platform-specific settings. This remains a roadmap capability until its data model and import/export behavior are verified.
5. **Support assistant** — factual troubleshooting tied to dated, platform-specific sources; distinguish confirmed facts from hypotheses.
6. **Test Lab** — repeatable scenarios and transcript comparisons across card versions, lorebooks, presets and models.
7. **Compatibility center** — explicit format/platform adapters with import receipts, export verification and lists of unsupported or transformed fields.

## Specialist AI modes, not separate products

Support, card drafting, lorebook design, preset coaching and test analysis should use separate instructions and validation rules while sharing a canonical project model, history, documentation sources and test evidence. A separate bot/application should be considered only if evidence shows that a workflow needs independent release or deployment.

## Core design rules

- **Local-first:** do not add a server-side card store or telemetry by default. Make external AI transmission clear.
- **User-controlled edits:** material AI edits are previewed, selective and undoable.
- **Loss-aware conversion:** do not silently discard unsupported data. Preserve unknown fields or provide a conversion receipt.
- **Evidence-led compatibility:** support claims are limited to tested formats and platform behavior.
- **Reproducibility:** record asset versions, provider/model, preset, scenario, sampling settings, context budget and evaluator for each test.
- **Honest evaluation:** AI judges provide fallible evidence, not objective ground truth. Pair scores with transcript excerpts and repeatable rubrics.
- **No premature breadth:** support a small set of platforms reliably before claiming universal compatibility.

## Product boundaries

The initial product is not intended to be a chat-hosting service, character marketplace, cloud-sync service or model-hosting platform. These add privacy, operating and maintenance costs and should be separate decisions backed by evidence of user demand.
