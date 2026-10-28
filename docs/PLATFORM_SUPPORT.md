# Platform and Format Support

**Last reviewed:** 2026-10-28. This matrix reflects code paths observed in the repository, not a certification of every runtime. Successful import alone does not prove semantic compatibility in a target application.

| Target | Current status | Evidence / limits |
|---|---|---|
| Character Card V2 fields | Implemented path | Editor and import/export paths exist. Fixture-based round-trip results should be required before claiming full preservation. |
| Character Card V3 fields | Implemented path | Editor and import/export paths exist. Unknown extensions and downstream runtime behavior require separate checks. |
| PNG cards with `chara` / `ccv3` metadata | Implemented path | Keep malformed, missing and oversized metadata covered by regression tests. |
| Character Card JSON | Implemented path | Test round trips for known and unknown fields. |
| CHARX archives | Implemented path | Bundled assets, archive safety and lorebook references need explicit fixtures. |
| Public Chub card import | Implemented path exists | Network/CORS failures, inaccessible cards and upstream schema changes can affect it; this is not an API-partnership claim. |
| Lorebook editing | Implemented | Cross-platform export parity and actual runtime activation need platform-specific tests. |
| Preset authoring/import/export across platforms | Planned | Do not advertise general portable preset support until schemas and adapters are implemented and tested. |
| SillyTavern-specific behavior | Candidate first adapter | Field overlap is not enough; validate settings, lorebook semantics and export behavior against current docs or a test instance. |
| RisuAI and other frontends | Planned | Add only after supported fields and conversion behavior are documented. |

## Status vocabulary

- **Implemented path:** relevant code exists. This does not imply complete or verified interoperability.
- **Verified:** fixture-based tests passed for a named format/runtime version and the test date is recorded.
- **Partial:** some fields are preserved or mapped; exclusions are explicit.
- **Planned:** not yet a support promise.

The repository's current state should not be described as universally compatible with roleplay frontends.

## Adapter requirements

Every adapter must provide:

1. A named source format and tested version/date.
2. Sample fixtures including edge cases and unknown extension fields.
3. Tests for import, edit, export and re-import where applicable.
4. A conversion receipt listing preserved, transformed, unsupported and dropped fields.
5. Safe failure behavior for malformed inputs without silent truncation.
6. A security review for remote fetching, archive extraction and secret handling.

A compatibility entry must never be marked **Verified** solely because the project builds or one manually selected file imports.
