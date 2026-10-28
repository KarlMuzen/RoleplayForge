# Roleplay Forge — The AI Roleplay Workbench

Roleplay Forge is the planned evolution of this CardCrucible-derived, local-first browser application into one workbench for authoring, organizing, converting and testing AI roleplay assets. The aim is to give creators a reliable place to manage character cards, lorebooks, generation presets and repeatable model evaluations without overstating cross-platform compatibility.

> **Repository state (2026-10-28):** The source currently contains the CardCrucible implementation and its existing features. The intended Roleplay Forge direction is documented here, but the app-facing title, in-app legacy labels and package/repository metadata have not yet been fully migrated. This documentation does not claim that the product rebrand or roadmap features are already implemented.

## Current foundation

The current codebase includes:

- A searchable card gallery and Character Card V2/V3 editing workflows.
- PNG card metadata, JSON and CHARX import/export paths, plus a public Chub card import path.
- Lorebook entry editing, activation and overlap utilities.
- Schema-validated AI-proposed card patches with review, selective application and undo support.
- Card variants, comparison tools, scenario runs, transcript review and diagnostic metrics.
- Connections to configured model providers, including Gemini, OpenAI, Anthropic, OpenRouter and local Ollama endpoints where the provider/endpoint supports them.
- Local browser storage, backup/restore, optional passphrase encryption for saved API keys, and device-to-device sync features.
- Progressive Web App configuration for installable browser use.

Feature presence does not, by itself, prove complete compatibility with every receiving platform. See the [platform support matrix](docs/PLATFORM_SUPPORT.md) for the limits of current claims.

## Product principles

- **One workbench, specialist workflows.** Support, card building, lorebook design, preset coaching and test analysis should share the same project data and history rather than fragment into separate bots or apps.
- **Local-first by default.** Keep character data in the user's browser unless a deliberate feature says otherwise. AI operations send selected content to the user's chosen provider; make that boundary clear.
- **Review before applying.** Material AI edits must be inspectable and selectively applicable, with undo support.
- **Loss-aware conversion.** Preserve unknown fields where feasible. When data must be transformed or dropped, provide a clear conversion report instead of silently losing it.
- **Repeatable evaluation.** Store enough information about the asset versions, model, settings, scenario and evaluator to explain comparisons.
- **Evidence-led compatibility.** Label features as implemented, partially supported, verified or planned. Do not equate successful import with equivalent runtime behavior.

## Work areas

### Library and card studio
Organize cards, edit supported fields, import and export known formats, manage variants, and run local consistency and token-budget checks.

### Lorebook studio
Create and edit entries, activation keys, regex options and ordering. Expand toward fixture-based validation of platform-specific activation behavior.

### AI assistance
Use structured, schema-validated proposals with previews and selective application rather than allowing unreviewed model output to rewrite a project.

### Testing lab
Run scenarios against configured providers, review transcripts, compare variants and inspect diagnostic signals. Evaluator scores are fallible evidence, not ground truth.

### Preset workshop — planned
Manage versioned generation settings separately from provider credentials. Show which parameters map cleanly across platforms and which are platform-specific or unsupported.

### Compatibility center — planned
Offer per-format/per-platform import and export adapters, round-trip tests and conversion receipts describing preserved, transformed, unsupported and dropped fields.

## Privacy and security

The application is designed around local browser storage and direct calls to the user's chosen model provider. Do not assume that prompts, selected card text or transcripts stay local when an AI feature is used: they may be sent to that provider.

Cards and lorebooks are stored in browser IndexedDB. The optional master passphrase encrypts saved API keys; it does **not** encrypt all card/lorebook content stored in the browser. Losing the passphrase can make encrypted keys unrecoverable. The project has not undergone a formal third-party security audit. Review the in-app security guidance before storing sensitive content.

## Roadmap and documentation

- [Product vision](docs/PRODUCT_VISION.md): mission, principles, work areas and boundaries.
- [Roadmap](docs/ROADMAP.md): phased delivery and completion criteria.
- [Platform and format support](docs/PLATFORM_SUPPORT.md): implemented paths versus verified compatibility.
- [Testing strategy](docs/TESTING_STRATEGY.md): required checks, integrity tests and release smoke tests.
- [Project status](docs/PROJECT_STATUS.md): current repository checkpoint and known verification gaps.

## Development

Requirements: Node.js 20+ (Node 20 is used by CI) or a compatible Bun environment.

```bash
npm ci
npm run dev
npm run lint
npm test
npm run build
```

The Vite development server normally uses port 3000. The repository's current CI workflow runs dependency installation, lint/type checking and tests. It does **not** currently run `npm run build`; a successful CI run should not be reported as a production-build verification until that check is added and passes.

## Contribution and release rules

- Add or extend fixtures for every new import/export capability.
- Test import → edit → export → re-import for data-bearing formats.
- Preserve unknown extension fields where feasible and report unsupported or dropped fields.
- Date platform compatibility claims and cite the tested version/schema.
- Label model pricing as estimated and potentially stale unless it is fetched and verified.
- Keep provider credentials out of card exports, logs and test fixtures.
- Update the changelog and relevant docs when behavior or support boundaries change.

## License

MIT. See [LICENSE](LICENSE) for the original CardCrucible license and attribution. Retain that attribution through the transition to Roleplay Forge.
