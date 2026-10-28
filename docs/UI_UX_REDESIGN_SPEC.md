# Roleplay Forge — UI/UX Redesign Specification

| | |
|---|---|
| **Status** | Draft for review. Not approved. P0 implementation is underway; see §15 for changes and validation status. |
| **Date** | 2026-10-29 |
| **Repository** | `KarlMuzen/RoleplayForge`, branch `main` |
| **Inspected commit** | `f17364140078d772363048584e0b3b760f80adf4` |
| **Scope** | Navigation, routing, responsive layout, screens, workflows, tokens, rollout, tests |

## 0. How to read this document

Every substantive claim carries one of three labels.

- **[V] Verified** — confirmed by reading inspected source, config, or project docs at the commit above. Where a claim comes from code reading and was not reproduced in a running app, it says so.
- **[R] Recommendation** — proposed design or implementation direction. Not current behavior.
- **[O] Open** — needs further inspection, testing, or deployment verification. Must not be treated as fact. Tracked in §13.

The initial draft was based on source inspection at the commit listed above. CI validation of subsequent P0 changes and remaining deployment/device verification are recorded in §15. Items not read are listed in §13 and are not described beyond their file names.

Items reported from the earlier screenshot review (20 of 30 screens) that were not confirmed in source are labelled **[O]**.

---

## 1. Executive summary

**[V]** Roleplay Forge is a Vite + React 19 + Zustand + Dexie + Tailwind v4 PWA derived from CardCrucible. Navigation is a single `activeTab` value in a Zustand store. There is no router, no history integration, and no persisted "where was I".

**[R]** The redesign delivers a coherent mobile-first workbench with four destinations: **Library** (the shelf), **Studio** (the bench for one card), **Lab** (tests, scenarios, runs, comparisons) and **Settings**. Assist is contextual inside Studio. Enhancer moves from Lab into Studio → Assist because it generates card patches. The Prompt inspector stays inside Studio because it is card-bound.

**[R]** The highest-value work is not visual. Verified defects in AI patch apply, undo reachability, snapshot restore, history cleanup, and a CSP/inline-script conflict are correctness and data-safety problems. They come first (P0). Structural navigation work (P1) follows. Information-architecture polish, transparency features, and Lab restructuring (P2–P3) come after the unread areas in §13 are inspected.

**[R]** History-based path routing is **not** recommended as the first step. It is gated on verified hosting fallback behavior (§4.5, V-01, V-02). The first routing step is a hash-based route adapter that provides back-button support and deep links with no hosting dependency, designed so the URL scheme can change later in one module.

**[R]** The existing data-safety posture is preserved. No database name, store schema, persisted key, encryption format, or sync/backup payload changes in this plan (§9.1). New persisted data, where proposed, uses new additive keys and is flagged for review.

---

## 2. Product principles

1. **[R]** Authoring first. The card being edited is the center of Studio and Lab; global screens support it.
2. **[R]** One way to do each thing. One diff component, one patch-review flow, one undo model, one vocabulary.
3. **[R]** Never lose work silently. Destructive actions are undoable or confirmed; failures are visible and specific.
4. **[R]** Honest numbers. Every token or cost figure says what it counts, how it was derived, and how fresh it is.
5. **[R]** Local-first and explicit about egress. Copy states what stays on-device and what is sent to a configured provider, and only what has been verified.
6. **[R]** Touch is primary. Every action works one-handed on a phone, with no hover-only or tooltip-only information.
7. **[R]** Retain the warm parchment / charcoal / clay direction and the loss-aware import and verify-export posture. Planned features (Presets, Compatibility center, run history, standalone lorebook library) are not shown as available until they exist.

---

## 3. Current-state architecture (all [V] unless marked)

### 3.1 Stack and build

- **[V]** React 19, Zustand 5, Dexie 4, Zod 4, Tailwind 4 (`@tailwindcss/vite`), `@dnd-kit`, `gpt-tokenizer`, `jszip`, `lucide-react`, `vite-plugin-pwa` 1.x. No router library is a dependency.
- **[V]** Views are lazy-loaded in `App.tsx`. Only the active view is mounted (`{activeTab === 'x' && <XView/>}`), so view-local React state is lost on tab switch. `ErrorBoundary` is keyed by `activeTab`.
- **[V]** CI (`ci.yml`) runs `npm ci`, `npm run lint` (tsc + eslint), `npm test` (vitest), `npm run build`. There is no end-to-end or browser test, and no automated accessibility check beyond `eslint-plugin-jsx-a11y`.
- **[V]** `docs/TESTING_STRATEGY.md` says CI does not run the build. `ci.yml` does. The doc is stale.
- **[V]** `bun.lock` is a zero-byte file alongside `package-lock.json`.

### 3.2 Navigation and state

- **[V]** `TabType` = `gallery | editor | lorebook | crucible | enhancer | assistant | settings | payload`.
- **[V]** Primary items (`Navigation.tsx`): Library (`gallery`), **Forge** (last of `editor/lorebook/payload/assistant`), **Test** (last of `crucible/enhancer`), Settings.
- **[V]** Forge sub-tabs: Details (`editor`), Lorebook, Prompt (`payload`), Assist (`assistant`). Test sub-tabs: Stress tests (`crucible`), Enhancer.
- **[V]** Desktop (`md:` and up): 256px sidebar with brand, "New Character", four nav items, Guide & Samples, an "Est. Cost" button, and an active-card block with "Test Chat".
- **[V]** Mobile: a floating bottom bar with the four items (10px labels, `min-h-12`). The top app header is hidden whenever the section is Forge or Test; those sections show a sticky sub-nav instead.
- **[V]** `WorkspaceSubNav` and `LabSubNav` are near-duplicate components (avatar, name, warning icon, help button, mobile "Chat" button, sliding tab indicator).
- **[V]** `activeTab` defaults to `gallery`; `activeCardUuid` starts `null`. A reload always lands on Library.
- **[V]** A grep of `src` found zero uses of `pushState`, `popstate`, `replaceState`, `location.hash`, `location.pathname`, `react-router`, or `wouter`.
- **[O]** The Android back-button outcome follows from the above (no history entries) but has not been observed on a device.

### 3.3 Persistence and invariants

- **[V]** Dexie database name `CardCrucibleDB`, class `CardCrucibleDatabase`, versions 1–5, `CURRENT_SCHEMA_VERSION = 5`. Tables: `cards`, `lorebooks`, `connectionProfiles`, `settings` (key/value).
- **[V]** `StoredCard` embeds `cardData`, `embeddedAssets` (binary), `snapshots` (full card copies), `testSuites`, `scenarios`, `variantOf`, `variantLabel`.
- **[V]** `settings` keys seen in source: `app_theme`, `editor_history_<cardUuid>`, `assistant_chats`, `cost_tracker_usage`. localStorage key `roleplay-forge-theme` mirrors the theme for early bootstrap. Encrypted API keys use the `enc.v1.` prefix.
- **[V]** `docs/PROJECT_STATUS.md` states: do not change existing IndexedDB keys, encryption formats, passkey identifiers, sync payload identifiers, or migration contracts for visual work.
- **[O]** The full inventory of persisted keys (passkey, sync, passphrase-verifier keys) was not enumerated. See V-10.

### 3.4 Screens inventory

| Screen / component | Verified facts |
|---|---|
| Library (`GalleryView`, `gallery/*`) | **[V]** Search and tag filter in store; multi-select with bulk delete; drag reorder via dnd-kit; import dropdown with file and Chub import; duplicate-detection modal; variant badges on tiles. **[O]** Toolbar, filter bar, import status, and empty state were not read; reported mobile action truncation and duplicated empty-state actions are unconfirmed (V-14). |
| Details (`EditorView`, `editor/*`) | **[V]** Order top to bottom: header (Save Card, Undo, Redo, Create Variant, "Export Card As…", Verify Export) → "Character Cover & Visual Card Export" block → Identity (name, creator, version, nickname, tags, then description / personality / scenario textareas with per-field "N tokens") → Greetings → Lorebook summary (total / constant / keyword-triggered) → Advanced Prompts (system prompt, post-history, creator notes) with Snapshots. Export formats: visual PNG, PNG, JSON, CHARX. `ExportVerifyModal` re-imports the exported bytes and diffs fields. |
| Lorebook (`LorebookView`, 906 lines) | **[V]** Edits `activeCard.data.character_book`. Entry add / duplicate / delete (no confirm), JSON import / export, "layers" with reorder and merge-to-card, a "Live Stack Simulator" and conflict analysis. |
| Prompt (`PayloadView`) | **[V]** Assembled-prompt preview, trigger-test input, "Total Footprint" in tokens, per-section token counts. |
| Assist (`AssistantView`) | **[V, partial]** Per-card persisted chat; messages can carry `patches`; apply and dismiss handlers read. **[O]** Rest unread (V-07). |
| Enhancer (`EnhancerView`) | **[V, partial]** Generates patches from diagnostic scores; header shows a "Phase 6" badge; apply handler read. **[O]** Rest unread (V-06). |
| Stress tests (`CrucibleView`, 829 lines, `crucible/*`) | **[V]** Existence and sizes only, plus data types: four default probe vectors; scenarios with personas `gentle / combative / chaotic / boundary_pushing / scripted`; scores `agendaHeld, tellConsistency, openerQuality, loreDelivery, driftOnsetTurn, reasoning`; only `lastRunResult` is stored. **[O]** Everything else unread (V-06). |
| Settings (`SettingsView`, `settings/*`) | **[V]** One scroll: Security → header with theme toggle ("App Settings & Organized API Configurations") → Connection profiles → Cost tracker → PWA → Backup & restore → Device sync → build label. |
| Modals | **[V]** Guide, Chat preview, Pre-flight audit, Decryption, Passphrase setup, Alert/confirm (`useDialogStore`), toasts exist. **[O]** Internals unread (V-17, V-18, V-19). |

### 3.5 Verified defects

| ID | Defect | Evidence |
|---|---|---|
| D-01 | No history integration; back-button and reload behavior unsupported | grep: zero matches |
| D-02 | Reload loses route and active card | `uiSlice` default `gallery`; `cardSlice` `activeCardUuid: null` |
| D-03 | `index.html` has an inline theme-bootstrap `<script>`; `public/_headers` CSP is `script-src 'self'` with no hash, nonce, or `unsafe-inline`. If those headers are served, the script is expected to be blocked. **[O]** Not tested on a deployed build. | `index.html`, `public/_headers` |
| D-04 | Lorebook patches address entries by array index (`lorebookEntryIndex`); no entry ID and no base-value guard. Assistant chats persist patches. | `patchSchema.ts`, `applyCardPatch.ts`, `AssistantView.tsx` |
| D-05 | `updateActiveCardData` pushes an undo entry and clears redo **before** running the updater. `applyCardPatch` throws on bad index; the handlers do not catch. Result (code reading, not reproduced): phantom undo entry, uncaught error, patches left in place, no user message. | `cardSlice.ts`, `AssistantView.tsx`, `EnhancerView.tsx` |
| D-06 | Patch preview shows two full-text blocks (current vs proposed). "Append" shows only the appended text, not the result. Selection is per patch. | `PatchPreviewPanel.tsx` |
| D-07 | Undo/Redo exist only in the Details header | grep: only `EditorView.tsx` |
| D-08 | Apply feedback differs: Assist shows a blocking "Patches Applied" modal; Enhancer applies silently | handlers |
| D-09 | "Phase 6" internal badge visible in Enhancer header | `EnhancerView.tsx` |
| D-10 | `deleteCard` and `bulkDeleteCards` clean `assistant_chats` but never delete `editor_history_<uuid>` | `cardSlice.ts` |
| D-11 | `restoreSnapshot` does not snapshot current state first, clears in-memory undo/redo, leaves persisted history unchanged, and does not update `activeCardRecord` | `cardSlice.ts` |
| D-12 | Every autosave calls `loadCardsFromDb()` → `db.cards.toArray()`, loading all records including assets and snapshots. Cost not measured. | `cardSlice.ts` |
| D-13 | `selectCardForEditing` does not flush a pending autosave or clear the timer. The timer saves whatever card is active **when it fires**, so edits made <800 ms before switching cards can be lost (code reading, not reproduced). | `cardSlice.ts` |
| D-14 | `lorebooks` table has no UI write path; only backup-restore writes it. Standalone lorebooks are not implemented. | grep |
| D-15 | Lorebook "layers" are component-local state; lost on tab switch | `LorebookView.tsx`, `App.tsx` |
| D-16 | Lorebook entry delete has no confirmation | `LorebookView.tsx` |
| D-17 | Security copy: "Zero-knowledge" (no server involved), "stored in plaintext in local storage" (storage is IndexedDB), "Passphrase Setup Mandated" badge on first run, no recovery statement seen | `SecuritySection.tsx` |
| D-18 | "Unlock Session" is a silent no-op when there are zero profiles; unlock uses `profiles[0]` | `SecuritySection.tsx` |
| D-19 | Incomplete-card warning is a `title=` on a `<span>`; ~60 `title=` attributes across components | `WorkspaceSubNav.tsx`, `LabSubNav.tsx`, grep |
| D-20 | Duplicate sub-nav components; help-button markup misindented | both files |
| D-21 | Three unlabelled meanings of "tokens": per-field tokenizer estimates, PayloadView "Total Footprint" (silently exact-or-estimate), cumulative API usage | `IdentitySection`, `PayloadView`, `useTokenTracker` |
| D-22 | `cost_tracker_usage` value is `Record<profileUuid, stats>` with no timestamps; sidebar "Est. Cost" is an all-time total | `useTokenTracker.ts`, `Navigation.tsx` |
| D-23 | A grep of `constants/models.ts` for `updated`, `asOf`, `lastVerified`, `stale` found nothing: no pricing source date visible (limited check) | grep |
| D-24 | Gallery import warnings are joined into one string | `GalleryView.tsx` |
| D-25 | Lab persists only the latest run result | `db/index.ts` |
| D-26 | Sub-navs have no top safe-area padding; Help button is 36px (`min-w-9 min-h-9`); drag handle 40px; many 10–11px labels | components |
| D-27 | On mobile the app header is hidden in Forge/Test, removing Install and Guide shortcuts there (Help remains in the sub-nav) | `Navigation.tsx` |
| D-28 | Manual "Save Card" button coexists with 800 ms autosave | `EditorView.tsx` |
| D-29 | Enhancer sits under Test although it generates card patches | `LabSubNav.tsx` |
| D-30 | `wrangler.toml` project name is `cardcrucible`; DB name and class are CardCrucible-derived | files |
| D-31 | Tests (by file name) cover Gallery, Crucible, Settings, ConnectionProfiles, ErrorBoundary views plus utilities. No tests by name for EditorView, LorebookView, Navigation/App, PatchPreviewPanel, or undo / snapshot / delete store behavior | `test/` listing |

### 3.6 Implemented vs planned

- **[V] Implemented (code exists):** card CRUD, variants, snapshots with diff, undo/redo (Details only), export (4 formats) with verify, PNG/JSON/CHARX/Chub import, embedded lorebook editing and layers, prompt assembly, schema-validated AI patches with per-patch selection, probe vectors and scenarios, connection profiles, encrypted keys with optional passkey unlock, backup/restore, device sync, PWA install/update.
- **[V] Planned, not implemented (per `ROADMAP.md`, `PRODUCT_VISION.md`):** golden fixtures, platform adapters, conversion receipts, Preset Workshop, versioned run records and comparison, specialist AI modes, Compatibility center, pricing source dates.
- **[R]** The UI must not advertise any planned item as available.

---

## 4. Proposed information architecture and navigation

### 4.1 Destinations

| Destination | Contents | Notes |
|---|---|---|
| **Library** | Card shelf, search, tags, import, new, select / bulk actions, variants | **[R]** A "Lorebooks" shelf is shown only after a UI write path for `lorebooks` exists (D-14). |
| **Studio** | Per-card: Details · Lorebook · Prompt · Assist (Chat / Enhance) | **[R]** Prompt inspector stays here (card-bound). Assist is not a primary destination. |
| **Lab** | Probes (stress tests) · Scenarios · Compare · Reports | **[R]** Segment names are provisional pending V-06. Enhancer is removed from Lab. |
| **Settings** | Connections · Security · Appearance · Usage & cost · Backup & sync · App & install · About | **[R]** Kept as "Settings". A "Tools" destination is introduced only when Compatibility and Presets give it real content. |

**[R]** Rationale for not creating "Tools" now: its only verified candidate content is Settings content plus the card-bound Prompt inspector. A renamed Settings page would mislabel where API keys live.

### 4.2 Vocabulary

| Concept | Current UI/code term | Proposed term |
|---|---|---|
| Authoring area | "Forge" | **Studio** |
| Test area | "Test" / "Crucible" / "Stress tests" | **Lab**; individual items "Stress test" |
| Details tab | "Details" (`editor`) | Details (keep) |
| Prompt tab | "Prompt" / "Live Payload Assembly & Trigger Test" | **Prompt preview** |
| AI edits | "patches", "Proposed Card Edits", "Apply N edits" | **Suggested edits** (one term everywhere) |
| Free local check | "Pre-Flight Audit" / "Zero-Cost Pre-Flight Writing Audit" | **Writing check** — **[O]** only after V-18 confirms it makes no network or AI calls |
| Saved states | "Snapshot" | Snapshot (keep); card copies are **Variants** |
| Token figures | "tokens" | See §6.4 |
| Provider config | "Connection profile" | Connection (UI), profile (code) |

### 4.3 Responsive layout

Breakpoints reuse Tailwind defaults already in use (`md` 768px, `lg` 1024px).

**Mobile (<768px) — [R]**

- Bottom bar: Library, Studio, Lab, Settings. Labels ≥12px. Item height ≥48px (existing `min-h-12` is retained).
- Studio and Lab share one **ContextBar** (§4.4) at the top, replacing both sub-navs, with safe-area top padding.
- The app header (brand, Install, Guide) appears only in Library and Settings. Install and Guide are also reachable from the ContextBar overflow menu.
- Lists open details as full-screen pushes (Lorebook entry, Settings section). Each push is a history entry so Back works.
- **[O]** Keyboard overlap with the floating bottom bar on Android (V-21). Candidate mitigations: hide the bar while a text field is focused, or test `interactive-widget` in the viewport meta.

**Tablet (768–1023px) — [R]**

- **[V]** Today the full 256px sidebar appears at 768px.
- **[R]** Use a narrow rail (icon + label, ~72px) instead.
- Studio Details uses two panes: section list | editor. Lorebook uses list | entry.

**Desktop (≥1024px) — [R]**

- Full sidebar (256px, current width retained). Studio content max-width ~`max-w-5xl`; at ≥1280px an optional right Inspector column (checklist, prompt size, Assist shortcut). P3.
- Settings is two-pane (section list | section).

### 4.4 ContextBar (Studio and Lab)

**[R]** One component, one row on ≥md, two rows on mobile.

- Row 1: card switcher (avatar + name + status), Undo, Redo, save-status chip, overflow menu.
- Row 2: section tabs (horizontally scrollable, ≥44px tall).
- Card switcher opens a sheet with search and recent cards. With no active card it shows an empty state with "Choose a card" and "New card".
- Status chip states: Saved / Saving… / Save failed (tap to retry). **[V]** `saveState` already has `idle | saving | saved | error`.
- Checklist button: shows a count badge from `validateCardCompleteness` (**[V]** returns a list of warning strings) and opens an accessible popover or sheet (replaces D-19).
- Overflow: Test chat, Writing check, Create variant, Export as…, Verify export, Snapshots, Help, Install (if available).
- Manual "Save Card" demoted to "Save now" in the overflow; the chip covers normal use (D-28).
- **[R]** Undo/Redo are visible on every Studio tab (fixes D-07). In Lab they are hidden (Lab does not edit the card).

### 4.5 Routing

**Facts**

- **[V]** No routing exists (D-01, D-02).
- **[V]** `vite.config.ts` sets Workbox `navigateFallback: '/index.html'` with a denylist for `manifest.webmanifest` and `_headers`. Manifest `start_url` and `scope` are `/`, `id` is `/`.
- **[V]** Repo contains `public/_headers` and `wrangler.toml` (Cloudflare Pages). It contains no `vercel.json` and no `_redirects`.
- **[O]** `navigateFallback` is handled by the service worker, so it can only help a navigation that the SW controls. It does not prove that a first visit, hard refresh, shared link, or SW-less browser to a client route works on any host. Whether Cloudflare Pages serves `index.html` for unmatched paths in this project, whether Vercel needs a rewrite, and which host is production are all unverified (V-01, V-02). Whether Vercel applies `_headers` is also unverified (V-03).

**Options**

| Option | Back button | Reload / deep link | Hosting dependency | Verdict |
|---|---|---|---|---|
| A. Hash routes `/#/studio/<id>/details` | Yes | Yes | None | **[R] Default for P1** |
| B. State-only with `pushState` and URL fixed at `/` | Yes | Reload loses place unless persisted | None | Fallback if A is rejected |
| C. Path routes `/studio/<id>/details` | Yes | Yes, if host fallback works | Needs verified fallback on every host | **[O] P3, after V-01/V-02 pass** |

**[R] Design**

- A small in-repo `routing` module (parse, serialize, subscribe, navigate, replace) behind an adapter interface. No new dependency unless review prefers one. URL scheme is changeable in one file.
- `activeTab` stays in the store during migration as a value **derived from the route**, so existing views keep working. The legacy tab ids remain internal.
- Route table (hash form shown):

| Route | Maps to |
|---|---|
| `#/library` (default) | `gallery` |
| `#/studio/:cardId` → redirects to `/details` | |
| `#/studio/:cardId/details` | `editor` |
| `#/studio/:cardId/lorebook` | `lorebook` |
| `#/studio/:cardId/prompt` | `payload` |
| `#/studio/:cardId/assist` (`?m=chat` \| `enhance`) | `assistant`; Enhancer is mode `enhance` |
| `#/lab/:cardId/<segment>` | `crucible` (segments provisional, V-06) |
| `#/settings` and `#/settings/:section` | `settings` |

- Rules:
  - Unknown route → Library with an info toast.
  - Unknown `cardId` → Studio empty state with message and "Back to Library".
  - Entering a Studio/Lab route calls `selectCardForEditing(cardId)`.
  - **Before any card switch or route change, flush the pending autosave** (fixes D-13).
  - Opening a card from Library pushes; tab changes inside Studio replace; modals and sheets push a history entry so Back closes them.
  - Back at Library root exits the PWA (the platform default).
- **Cold start:** installed-PWA `start_url` stays `/`. Last route restore is **[R]** via a new additive key; it must not reuse existing keys. Whether this key is included in backup is undecided (V-10).
- **[R]** Existing `?`-less shares are not a requirement. Deep links are not security-sensitive; route params never carry secrets.

---

## 5. Screen-by-screen behavior

Requirement IDs (`UX-…`) are referenced by the rollout plan and acceptance criteria.

### 5.1 Library

**Current [V]:** see §3.4. **[O]** Mobile action truncation and duplicated empty-state actions are unconfirmed (V-14).

**Proposed [R]**

- **UX-LIB-1** Header: search, tag filter, primary "New", secondary "Import". Overflow holds the rest. Nothing is truncated at 360px width.
- **UX-LIB-2** Tile tap opens `#/studio/<id>/details`. Per-tile overflow (≥44px target): Open, Create variant, Export, Delete. Delete is confirmed and states what else is removed (assistant chat, history).
- **UX-LIB-3** Explicit **Select** mode for bulk actions; checkboxes appear only in that mode. Reorder is a distinct mode on touch so scrolling and dragging do not conflict. **[O]** Test dnd-kit touch sensor behavior on Android first.
- **UX-LIB-4** Empty state shows one set of actions (Create, Import, Samples via Guide). The toolbar hides those same actions while empty. **[O]** Confirm the duplication exists before changing it.
- **UX-LIB-5** Import shows a progress state, then an **Import receipt** (§6.7). Duplicate-detection modal stays.
- **UX-LIB-6** Variant tiles show a parent link badge that is readable on touch (not `title`-only).
- **UX-LIB-7** Performance: the list renders from card summaries. See §6.9 H-3.

### 5.2 Studio → Details

- **UX-DET-1 Order [R]:** (1) Name + completeness; (2) Description, Personality, Scenario; (3) Greetings; (4) Lorebook summary (link to Lorebook tab); (5) Advanced prompts; (6) Metadata (creator, version, nickname, tags); (7) Card art and export. Rationale: authors write prose most; cover/export blocks currently sit above all fields (**[V]** current order).
- **UX-DET-2** Export moves into one **Export** sheet (format choice, verify, last export). Snapshots and variants move into one **History** sheet. Both open from the ContextBar overflow and from section footers.
- **UX-DET-3** Each long field shows `~N est. tokens` using the §6.4 badge. Fields have an "Improve with Assist" entry that opens suggested edits using the shared review flow (§6.1). **[O]** Depends on the unread `useFieldRegeneration` (V-05).
- **UX-DET-4** Inline validation messages sit under the field; the ContextBar checklist lists all issues.
- **UX-DET-5** Textareas auto-grow with a max height and a "expand" action; no nested scroll traps on mobile.

### 5.3 Studio → Lorebook

See §6.3. Layout: mobile = entry list → full-screen entry editor; ≥md = list | editor.

### 5.4 Studio → Prompt

- **UX-PRM-1** Title "Prompt preview". Top summary uses the §6.4 *Prompt size* badge (exact vs estimate chip, tokenizer scheme name — **[V]** `getTokenSchemeName(provider)` exists).
- **UX-PRM-2** Sections listed with token share; "Always sent" vs "Conditional" grouping uses vocabulary already present (**[V]** Lorebook summary labels "Constant Injections" and "Keyword Triggered").
- **UX-PRM-3** Trigger test is a collapsible "Simulate a user message" panel.
- **UX-PRM-4** Behavior is unchanged; this is relabeling and layout.

### 5.5 Studio → Assist

- **UX-AST-1** Two modes in one tab: **Chat** (current `AssistantView`) and **Enhance** (current `EnhancerView`). Both use the same Suggested-edits review (§6.1).
- **UX-AST-2** Require a connection. With none, show a guided empty state linking to Settings → Connections.
- **UX-AST-3** Remove the "Phase 6" badge (D-09).
- **UX-AST-4** Enhance consumes Lab diagnostic scores. **[O]** How it obtains them is unread (V-06); the Studio↔Lab data handoff must be confirmed before moving it.
- **UX-AST-5** Chat history stays per card (**[V]** keyed by card uuid in `assistant_chats`). No format change.

### 5.6 Lab

- **UX-LAB-1 [R]** Lab contains tests, runs, scenarios, comparisons only. Enhancer is removed.
- **UX-LAB-2 [O]** Segment structure (Probes · Scenarios · Compare · Reports) is provisional. Do not restructure beyond relocating Enhancer until `CrucibleView`, `useCrucibleRun`, and the panels are read (V-06).
- **UX-LAB-3 [V/R]** Current persistence is `lastRunResult` only. UI must say "Latest run" and must not imply history. Run records with provider/model/settings/hashes are roadmap Phase 4 (**[V]** planned) and are out of scope here.
- **UX-LAB-4** No connection → guided empty state. Runs that spend tokens show an estimate before start. **[O]** Whether an estimate exists today is unread.

### 5.7 Settings

- **UX-SET-1 Order [R]:** Connections → Security → Appearance → Usage & cost → Backup & sync → App & install → About. Connections first because most users arrive for API setup.
- **UX-SET-2** Mobile: section list → section screen (history entry per section). Desktop: two-pane. Route `#/settings/<section>`.
- **UX-SET-3** Heading "Settings". Replace "App Settings & Organized API Configurations".
- **UX-SET-4** Theme toggle moves to Appearance. **[V]** Today it is in the Settings header, the desktop sidebar, and the toggle persists to IndexedDB and mirrors to localStorage; that behavior is unchanged.
- **UX-SET-5** Destructive security actions (Remove passphrase) are visually separate from routine actions (Lock) and require the existing confirm.
- **UX-SET-6** Unlock Session works with zero profiles (§6.8).
- **UX-SET-7** Backup shows what is included and warns that uninstalling the PWA or clearing site data can remove local data. **[O]** Confirm per platform (V-21).

### 5.8 Modals and sheets

- **UX-MOD-1** One focus-trapped sheet/dialog pattern. **[V]** `useModalA11y` exists and is used in Gallery; **[O]** coverage elsewhere is unknown (V-17).
- **UX-MOD-2** On mobile, sheets are bottom-anchored with a drag/close affordance and respect safe-area insets.
- **UX-MOD-3** Back button closes the topmost sheet (history entry per sheet).

---

## 6. Cross-cutting requirements

### 6.1 Suggested-edits review (patch review)

**Current [V]:** D-04, D-05, D-06, D-08. Schema fields: `field`, `action` (`replace | append`), `value`, optional `lorebookEntryIndex`, `rationale`. Nine card text fields plus lorebook entry **content**.

**Requirements [R]**

- **UX-PR-1 Staleness guard.** On receiving patches, compute and store client-side a hash of the target text at generation time (`baseHash`) on the stored message. This does not change the schema sent to or returned by the model. At apply time, compare against the current text. Mismatch → patch is marked **Out of date** and not selectable until refreshed or explicitly overridden. Patches without `baseHash` (persisted before this change) show "Can't verify — compare carefully" and require the current-value view.
- **UX-PR-2 Lorebook targeting.** Resolve the entry by stable ID if the entry schema has one; otherwise by index **plus** `baseHash` of the entry content. **[O]** Whether entries carry an ID is unknown (`cardSchema.ts` unread, V-08).
- **UX-PR-3 Transactional apply.** Validate all selected patches against the current card first. Compute the next card state fully **before** touching undo. If any patch fails, apply none, keep all patches, and show which failed and why. No phantom undo entry; no uncaught exception (fixes D-05).
- **UX-PR-4 One undo step per apply, with a forced boundary** that bypasses the 500 ms coalescing window (**[V]** `updateActiveCardData` coalesces pushes within 500 ms).
- **UX-PR-5 Feedback.** Replace the blocking modal and the silent path with one non-blocking confirmation: "Applied 3 edits · Undo". The Undo action is enabled only while no later edit exists; otherwise the label reads "Open history".
- **UX-PR-6 Inline diff.**
  - Replace: word-level diff of current → proposed, with removed and added text.
  - Append: show the **resulting** text with the appended segment highlighted.
  - Diff must not rely on color alone: use `+` / `−` markers and "Removed" / "Added" labels, with `aria-label`s.
  - Mobile default: unified inline view. ≥md: optional side-by-side toggle.
- **UX-PR-7 Selection.** Per-patch selection retained (P1). Per-hunk selection is P2. Order-dependent patches on the same field (replace then append) are grouped and applied/skipped together or show an explicit order warning.
- **UX-PR-8 Unify** the three review surfaces (Assist, Enhance, per-field regeneration diff) on one `SuggestedEditsReview` and one `DiffView`. **[O]** Per-field regeneration was not read (V-05); do not remove it before it is.
- **UX-PR-9 Scope honesty.** The schema supports the nine text fields and lorebook content only. The UI must not suggest it can edit keys, greetings lists, tags, or lorebook settings.
- **UX-PR-10 Dismiss** keeps the patches available from the message until the user clears them; dismissal is itself undoable within the session. **[R]** (Today dismiss discards.)

### 6.2 Undo / redo

- **[V]** `undoStack`/`redoStack` hold up to 50 full-card deep copies; persisted to `editor_history_<uuid>` on each save; `UndoState` is `{ cardData }`.
- **UX-UR-1 [R]** Undo/Redo in the ContextBar on all Studio tabs. Keyboard shortcuts on desktop (Ctrl/Cmd+Z, Shift+Z) are additive and must not hijack text-field native undo.
- **UX-UR-2 [R]** The `UndoState` shape and the persisted payload do not change. Labels, if any, stay in memory only.
- **UX-UR-3 [R]** Snapshot restore pushes an undo entry (or auto-creates a "Before restore" snapshot) instead of clearing history (fixes D-11).
- **UX-UR-4 [O]** Persisted history size and write cost per autosave are unmeasured (V-22).

### 6.3 Lorebook editing

- **UX-LB-1 [R]** Delete shows "Entry deleted · Undo" (global undo works because edits go through `updateActiveCardData`; **[V]**). If Undo is not guaranteed available on this tab, add a confirm. With UX-UR-1 it is available.
- **UX-LB-2 [R]** Entry list rows show name/keys, enabled state, constant vs keyword, token estimate; ≥48px rows; reorder via explicit mode.
- **UX-LB-3 [R]** The layer stack is either (a) clearly labeled "This session only" or (b) persisted per card under a **new** additive key. Decision needed; **[O]** depends on backup behavior (V-10). Default recommendation: (a) in P2 with a visible label, (b) later.
- **UX-LB-4 [R]** Consolidate the three trigger testers (Lorebook "Live Stack Simulator", `crucible/LorebookSimulatorPanel`, Prompt trigger test) into one "Activation test" component. **[O]** Their differences are unknown (V-06); do not merge before comparing.
- **UX-LB-5 [R]** Do not show a Lorebook library shelf until a UI write path for the `lorebooks` table exists (D-14). Importing a stored lorebook as a layer (**[V]** exists) stays.
- **UX-LB-6 [R]** Duplicate entry currently appends `_copy` to each key (**[V]**). Keep behavior; show a toast saying so.

### 6.4 Token terminology

Three distinct figures, three distinct labels (fixes D-21).

| Figure | Label | Rules |
|---|---|---|
| Per-field and per-entry counts (tokenizer-based) | **`~N est. tokens`** | Tilde always shown. Info popover names the tokenizer scheme. **[V]** `gpt-tokenizer` is used. Counts for non-OpenAI models are approximations; **[O]** whether scheme mapping per provider is accurate is unread. |
| Assembled prompt size (Prompt tab) | **Prompt size** + chip **Exact (`<scheme>`)** or **Estimate** | The exact/estimate state is always visible. **[V]** Code silently switches between them today. |
| Cumulative API usage | **API usage (this device)** + "since `<date>`" | Not called "tokens" alone. |

- **UX-TK-1** Chips use text, not color alone.
- **UX-TK-2** Info popovers are tap-activated and keyboard-focusable (no `title`).
- **UX-TK-3 [O]** Whether recorded usage is provider-reported or locally estimated is unknown (call sites of `recordUsage` unread, V-13). The label must not claim "reported" until confirmed.

### 6.5 Cost transparency

- **[V]** `cost_tracker_usage` is `Record<profileUuid, { profileName, model, promptTokens, completionTokens, totalTokens }>`. No timestamps. Sidebar shows an all-time total with a title-attribute caveat. Pricing is per-1K in `MODEL_PRICING_PER_1K` with a fuzzy fallback loop in `calculateModelCost`; custom per-profile prices exist.
- **UX-CT-1 [R]** Rename sidebar item to "Est. spend (all time)". Replace the `title` caveat with a tap-open note: "Estimate. Provider prices change; verify with your provider."
- **UX-CT-2 [R]** Show the "since" date and reset control in Settings → Usage & cost. Store it in a **new** key (`cost_tracker_meta`). **Do not add metadata inside `cost_tracker_usage`**: its value is keyed by profile uuid and adding fields would corrupt that shape.
- **UX-CT-3 [R]** Each model price shows its source and last-checked date once the data exists. Until then, show "Price date unknown." Roadmap Phase 1 already plans this (**[V]**).
- **UX-CT-4 [R]** Unknown or fuzzy-matched model prices display "Price unknown / approximate" instead of a confident figure. **[O]** Actual fallback behavior unread (V-12); verify first.
- **UX-CT-5 [R]** Estimate-before-run for Lab and Enhance when the information exists (**[O]**).

### 6.6 Navigation-level data-safety UX

- **UX-DS-1 [R]** Leaving a screen never discards unsaved state silently. Autosave flush on route change (§4.5).
- **UX-DS-2 [R]** Any operation that replaces card data (import overwrite, snapshot restore, patch apply) is undoable or preceded by an automatic snapshot, and says so.
- **UX-DS-3 [V]** Import overwrite (`importCardRecord` with `overwriteUuid`) replaces `cardData` and assets and does not touch the active in-memory card or its history. **[R]** If the overwritten card is the active card, reload it into the store and reset or snapshot its history. **[O]** Reachable UI path for overwrite not confirmed (V-14).

### 6.7 Import receipts

- **[V]** Current: warnings collected into one string; duplicate modal; `GalleryImportStatus` exists (unread). Roadmap plans conversion receipts (planned, not implemented).
- **UX-IR-1 [R]** An `ImportReceipt` view model: source file, detected format and version, per-item outcome (imported / skipped duplicate / failed), and four lists per item: **Preserved**, **Transformed**, **Unsupported**, **Dropped**, plus warnings with severity.
- **UX-IR-2 [R]** UI: summary line + expandable sections; copyable text; persisted for the session first. Saved-with-card receipts are a later decision.
- **UX-IR-3 [R]** Never show "Preserved" or "Dropped" lists the io layer cannot actually compute. **[O]** Whether `converter.ts`/`index.ts` can report these is unread (V-09). This blocks UX-IR until read; until then, structure the existing warnings (list, not one string) without claiming field-level accuracy.
- **UX-IR-4 [R]** Export verify (**[V]** exists) shares the receipt styling and diff component.

### 6.8 Settings and security copy

Gate: copy that states security properties ships only after the checks in V-10 and V-24.

- **UX-SC-1 [R]** Replace "Master Passphrase & Key Encryption Security" / "Zero-knowledge…" with:
  - Title: **"API key protection"**
  - Body: "Saved API keys are encrypted on this device with a passphrase you choose (AES-256-GCM; key derived with PBKDF2, 600,000 iterations). **[V]** parameters appear in current copy."
  - Add: "Keys are sent only to the provider you configure." **[O]** Verify against backup, device sync, and custom-header paths before shipping this sentence.
  - Add: "If you forget the passphrase, saved keys can't be recovered. You would re-enter them." **[O]** Confirm no recovery mechanism exists (V-24).
- **UX-SC-2 [R]** First-run badge "Not set up" (neutral), not "Passphrase Setup Mandated" (reads as an error). **[V]** The passphrase is required only to *save* keys (`profileSlice` blocks plaintext storage) and Ollama/custom profiles may need no key (profile form check). Copy says exactly that: "Needed to save API keys."
- **UX-SC-3 [R]** Say "IndexedDB / on this device", not "local storage".
- **UX-SC-4 [R]** "Unlock" works with zero profiles by invoking the unlock/passphrase request flow directly (**[V]** `unlockSession` and `decryptionRequest` exist in the session slice). It does not depend on `profiles[0]`.
- **UX-SC-5 [R]** The Connection form hint changes from "Set a Master Passphrase in Security…" to "You'll be asked to create a passphrase when you save this key" (**[V]** save triggers the setup request).
- **UX-SC-6 [R]** Passkey copy keeps "passphrase remains the sole root of trust" (**[V]** current wording).

### 6.9 Data hygiene

- **H-1 [R]** `deleteCard` and `bulkDeleteCards` also delete `editor_history_<uuid>` (D-10). Add a sweep for existing orphans: remove `editor_history_*` keys with no matching card. The sweep runs once at start, logs a count, and is skipped unless V-10 confirms backup/sync behavior for those keys.
- **H-2 [R]** Snapshot restore: auto-snapshot current state ("Before restore"), keep undo stacks, update `activeCardRecord`, reconcile the persisted history key (D-11). Snapshot count/size is surfaced so the new auto-snapshot cannot grow unbounded (cap or prompt).
- **H-3 [R]** After autosave, update only the affected summary in `cards` rather than reloading all records (D-12). **[O]** Measure first (V-22). Library reads should not require `embeddedAssets` or `snapshots` for list rendering.
- **H-4 [R]** Flush pending autosave and clear its timer before any card switch (D-13). Add a regression test.
- **H-5 [O]** History payload cap by size, not just count; needs measurement.
- **H-6 [R]** A storage panel in Settings → Backup & sync: total size by cards, history, chats; "Clear history for deleted cards". **[O]** Use `navigator.storage.estimate` only after confirming availability on target browsers.

### 6.10 Accessibility

Target: **WCAG 2.2 AA [R]**.

- **UX-A-1** Replace informational `title=` tooltips with tap/keyboard **InfoPopover** (button, `aria-expanded`, focus return, dismiss on Escape/outside tap). Keep `title` only as a redundant desktop hint.
- **UX-A-2** Primary touch targets ≥44×44 CSS px; spacing ≥8px between adjacent targets. **[V]** Offenders: Help button 36px, drag handle 40px. **[O]** Sub-nav tab height not measured.
- **UX-A-3** Essential information ≥12px. 10–11px only for non-essential metadata. **[V]** Many 10–11px labels exist today.
- **UX-A-4** Contrast: body 4.5:1, large text and UI components 3:1, in both themes. **[O]** Actual values unknown until tokens are read (V-15). Add an automated token-pair contrast test.
- **UX-A-5** Visible focus ring on every interactive element, using a dedicated `--focus` token, ≥3:1 against adjacent colors.
- **UX-A-6** Toasts and save/apply status in a polite live region; errors assertive. **[O]** Current `ToastContainer` semantics unread (V-17).
- **UX-A-7** Respect `prefers-reduced-motion`. **[V]** `PROJECT_STATUS.md` says reduced-motion refinements were made; **[O]** not verified in CSS.
- **UX-A-8** The viewport meta currently permits zoom (`maximum-scale=5.0`, **[V]**); keep it. Layouts must work at 200% text size.
- **UX-A-9** Tabs use `role="tablist"/"tab"` semantics (or navigation landmarks for route-backed links); bottom bar is a `nav` with `aria-current="page"`.
- **UX-A-10** Dialogs: labelled, focus-trapped, restore focus. **[V]** The Guide overlay has `role="dialog" aria-modal`.
- **UX-A-11** Diffs and status chips never rely on color alone (§6.1, §6.4).

---

## 7. Design system

### 7.1 Principles

**[R]** Keep the parchment / charcoal / clay direction. Add a **semantic token layer** on top of the existing palette; do not rename existing utilities in P0–P2.

**[V]** Existing utility names: `void-*` (surfaces), `knight-*` (neutral text/borders), `maroon-*` (accent, used for the clay accent), `mist-*` (light text), plus raw `amber`, `emerald`, `red`. The only verified color values are the `theme-color` metas: dark `#191816`, light `#f7f4ee`. **[O]** All other values live in `src/index.css`, which was not read (V-15). The values below are therefore *roles*, not hex codes.

### 7.2 Semantic color roles [R]

| Token | Role | Notes |
|---|---|---|
| `--surface-base` | App background | Dark equals `#191816` **[O]** confirm alignment |
| `--surface-raised` | Cards, sheets | |
| `--surface-sunken` | Inputs, code/diff bg | |
| `--border-subtle` / `--border-strong` | Dividers / control borders | |
| `--text-primary` / `--text-muted` / `--text-disabled` | | `muted` must hold 4.5:1 on all surfaces |
| `--accent` / `--accent-hover` / `--accent-on` | Primary action (clay) | |
| `--focus` | Focus ring | ≥3:1 |
| `--success` / `--warning` / `--danger` / `--info` + `-bg` variants | Status | Always paired with icon + text |
| `--diff-add-bg/-fg`, `--diff-remove-bg/-fg` | Diff | Pair with `+`/`−` markers |
| `--scrim` | Modal backdrop | |

Both themes define every token. Components reference only semantic tokens. Raw `amber`/`emerald`/`red` usages migrate to status tokens over time (P2–P3). Optional P3: alias `maroon-*` → `accent-*` and rename.

### 7.3 Typography [R]

- **[V]** Classes `font-display` and `font-mono` are used; Google Fonts are cached at runtime and the CSP allows them. **[O]** Actual families unknown (V-15).
- Scale: caption 12px, body-sm 14px, body 16px (mobile text inputs ≥16px to prevent iOS zoom-on-focus), title 18–20px, display 24px+. Mono for token figures, diffs, keys.
- Line height 1.4–1.6 for prose; max line length ~70ch in editors on wide screens.

### 7.4 Layout tokens [R]

- Spacing: 4px base (4, 8, 12, 16, 24, 32).
- Radius: control 10–12px, card 16px, sheet 20px (current `rounded-xl/2xl` are close).
- Touch: min target 44px; list rows 48px.
- Z-layers **[V]** today: sub-nav 20, sidebar/header 30, bottom bar 40, overlays 50. **[R]** Keep, and add: toast 60, popover 55.
- Safe areas: **[V]** bottom bar and mobile header use `env(safe-area-inset-*)`; sub-navs do not. **[R]** All fixed/sticky bars use insets (ContextBar top, sheets bottom).

### 7.5 Reusable components [R]

`AppShell`, `NavRail/Sidebar`, `BottomNav`, `ContextBar`, `SectionTabs`, `CardSwitcherSheet`, `SaveStatusChip`, `UndoRedoButtons`, `InfoPopover`, `TokenBadge` (`kind: est | prompt | usage`), `DiffView`, `SuggestedEditsReview`, `UndoToast`, `Sheet`/`Dialog` (wrapping existing `useModalA11y`/`useDialogStore` after V-17), `ImportReceipt`, `EmptyState`, `ListDetail` (mobile push / desktop two-pane), `SettingsSectionList`, `ChecklistPopover`, `OverflowMenu`.

---

## 8. Rollout plan

Dependencies are explicit. "Gate" means an Open item in §13 must be resolved first.

### P0 — Correctness, safety, copy (no IA change)

| ID | Work | Depends on / gate | Acceptance criteria |
|---|---|---|---|
| P0-1 | Hosting & CSP verification spike (preview deploys; no app change) | none | V-01–V-04 each have a recorded result |
| P0-2 | Theme bootstrap compatible with CSP (external script or hash) | V-04 confirmation | On a deployed preview with `_headers` active, no CSP violation, no theme flash for a light-theme user on cold load |
| P0-3 | Transactional patch apply; no phantom undo; user-visible failure; forced undo boundary | none | Tests: out-of-bounds index applies nothing, adds no undo entry, shows an error; applying N patches adds exactly 1 undo entry and one Undo restores the prior state |
| P0-4 | Accessible incomplete-card checklist replacing `title` | none | Reachable by keyboard and touch; lists issues; tested |
| P0-5 | Security/settings copy fixes + Unlock with zero profiles | V-24 for recovery sentence; V-10 for egress sentence | Unlock works with 0 profiles; no "zero-knowledge"; no "local storage" |
| P0-6 | Delete cleans `editor_history_<uuid>` | none | Test: after `deleteCard`/`bulkDeleteCards`, key is absent; other keys unchanged |
| P0-7 | Snapshot restore safety | none | Restore is undoable (or auto-snapshot created); active record updated |
| P0-8 | Remove "Phase 6" badge; fix `TESTING_STRATEGY.md` drift | none | Strings gone; doc matches CI |
| P0-9 | Android baseline smoke test of *current* app (record, no changes) | device | §10 checklist run and logged as the regression baseline |
| P0-10 | Invariants test (§9.1) | none | Fails if listed identifiers change |

### P1 — Structure

| ID | Work | Depends on / gate | Acceptance criteria |
|---|---|---|---|
| P1-1 | Hash route adapter, route table, back button, restore last route | P0-9; V-10 for restore key | Back/forward step through screens; sheets close on Back; reload on `#/studio/<id>/details` reopens it; unknown ids handled; legacy `activeTab` derived |
| P1-2 | Flush autosave before card switch / route change | P1-1 | Regression test for D-13 passes |
| P1-3 | `ContextBar` replaces both sub-navs; Undo/Redo on all Studio tabs | P1-1 | Both old components deleted; Undo works on Lorebook and Assist; safe-area padding |
| P1-4 | Move Enhancer into Studio → Assist (mode `enhance`) | V-06, V-07 | Enhancer absent from Lab; behavior unchanged; Lab nav has no Enhancer |
| P1-5 | Suggested-edits review v2: `DiffView`, stale guard, undo toast | V-05, V-07, V-08 | §6.1 criteria; tests with a stale patch and a reordered lorebook |
| P1-6 | Library mobile actions and empty state | V-14 | No truncated action at 360px; one set of empty-state CTAs; ≥44px targets |
| P1-7 | Autosave no longer reloads all cards | V-22 | Measured improvement on a large library fixture; same visible behavior |
| P1-8 | Semantic token layer (additive) | V-15 | Both themes define every token; contrast test passes |

### P2 — Information architecture and transparency

| ID | Work | Depends on / gate |
|---|---|---|
| P2-1 | Settings sections, order, routes; copy per §6.8 | P1-1, V-11 |
| P2-2 | Details reorder; Export and History sheets | P1-3, V-05 |
| P2-3 | Lorebook: delete-undo toast, row design, layer-stack label, Activation test consolidation | P1-5, V-06 |
| P2-4 | Token labels (§6.4) and cost transparency (§6.5) incl. `cost_tracker_meta` | V-12, V-13 |
| P2-5 | Import receipts | V-09 (blocker for field-level lists) |
| P2-6 | Lab segmentation and run-latest UX | V-06 |
| P2-7 | Playwright smoke tests and automated a11y in CI | P1-1 |

### P3 — Later

Tablet rail and two-pane Studio; docked Assist at ≥1280px; path routes (**gated on V-01/V-02**); PWA shortcuts; standalone lorebook shelf (needs UI write path); per-hunk patch selection; `maroon-*`→`accent-*` rename; "Tools" destination once Compatibility/Presets exist; layer-stack persistence.

---

## 9. Regression safeguards and tests

### 9.1 Invariants (must not change without a separate, reviewed migration plan)

- **[V]** Dexie DB name `CardCrucibleDB`; schema versions 1–5; `CURRENT_SCHEMA_VERSION = 5`; table names and indexes.
- **[V]** `settings` keys: `app_theme`, `editor_history_<uuid>` (prefix `editor_history_`), `assistant_chats`, `cost_tracker_usage` (value shape `Record<profileUuid, ProfileTokenStats>`).
- **[V]** localStorage key `roleplay-forge-theme`.
- **[V]** Encrypted key prefix `enc.v1.`, AES-GCM and PBKDF2 parameters as implemented.
- **[V]** Persisted `UndoState` shape `{ cardData }`; stored chat message shape (additive fields only).
- **[V per docs, O for enumeration]** Passkey identifiers, sync payload identifiers, backup format and migration contracts (V-10).
- **[R]** New persisted data uses **new** keys only, is additive, is tolerant of absence, and is listed in the invariants test.
- **[R]** `DB` name and class names stay even though they are CardCrucible-derived; `wrangler.toml` project name and production origin are not changed as part of this work (IndexedDB is origin-scoped; changing origin strands local data without a backup/restore path — **[O]** plan separately).

### 9.2 Automated tests required

- **Invariants:** assert DB name, version, key constants/prefixes, `UndoState` shape, `cost_tracker_usage` shape.
- **Store:** delete cleanup (H-1); snapshot restore (H-2); card switch flush (H-4); `updateActiveCardData` does not push undo when the updater throws; undo coalescing boundary on apply.
- **`applyCardPatch` / transactional apply:** bounds, stale hash, mixed success/failure, ordering on the same field. Extends existing `applyCardPatch.test.ts`.
- **DiffView:** word diff correctness for replace/append; accessible labels.
- **Router:** parse/serialize round-trip; unknown route/id; back/forward; sheet history entries; legacy `activeTab` derivation.
- **Components:** ContextBar (warnings popover, undo/redo, status states), SuggestedEditsReview, Settings unlock with 0 profiles, Library empty state and actions, TokenBadge variants, ImportReceipt rendering.
- **Persistence with `fake-indexeddb`** (**[V]** dev dependency present): migrations load unchanged; old `assistant_chats` with patches lacking `baseHash` render and apply safely.
- **Golden fixtures** (roadmap Phase 1, **[V]** planned): import → edit → export → re-import for PNG/JSON/CHARX must pass before import receipts claim field-level accuracy.
- **A11y:** axe checks on key screens in both themes; token-pair contrast test; focus-order tests for sheets.
- **CI:** keep lint/test/build; add Playwright (Chromium, mobile viewport, touch) smoke for navigation, back button, patch apply/undo, and reload restoration (P2-7, **[R]**). Installed-PWA behavior still needs manual checks.

### 9.3 Review gates

- Any PR touching `src/db`, `src/io/backup.ts`, `src/store/slices/profileSlice.ts`, `sessionSlice.ts`, or `utils/crypto*` requires invariants test green and explicit sign-off.
- Visual-only PRs must not modify those files.

---

## 10. Manual Android installed-PWA checks

**[O]** None has been run. Run on at least one real device (Chrome, Android gesture navigation) against a deployed preview. Back up data first; **[O]** whether uninstalling the PWA clears IndexedDB must be tested and recorded, not assumed.

1. Install from Chrome; launch standalone; icon is not clipped in the launcher mask.
2. Status/nav-bar color matches theme in light and dark; toggle theme and relaunch.
3. Cold launch, force-close, relaunch: route restored (after P1-1).
4. System Back: from Studio sub-tab, from an open sheet, from Library root.
5. Rotate portrait ↔ landscape (**[O]** `PortraitGuard` behavior unread).
6. Software keyboard open in Details, Lorebook, Assist: bottom bar does not cover the focused field; field scrolls into view.
7. Library: import PNG/JSON/CHARX; create; edit; export; re-import; variants; bulk select and delete; reorder by touch.
8. Studio: edit text, switch cards within a second, confirm no lost edits.
9. Assist: generate suggested edits; reject one; apply others; Undo from toast; Undo/Redo from ContextBar; kill and relaunch app; history intact.
10. Lorebook: add / delete / undo; layer stack label.
11. Settings: set passphrase, save a key, lock, unlock with and without profiles, passkey enroll/remove (if supported), backup, restore.
12. Offline launch after install; edit offline; reconnect.
13. Service-worker update prompt appears and applies without data loss (**[O]** `usePWAUpdate` unread).
14. TalkBack pass on nav, ContextBar, review sheet, Settings.
15. System font scale 130–200%: no clipped controls.
16. Large import and a large library: scrolling and autosave remain responsive.

---

## 11. Deployment validation

**[O]** All items below are unverified.

1. Identify the production host(s). The repo contains `wrangler.toml` (Cloudflare Pages); Vercel is mentioned but there is no Vercel config in the repo.
2. For **each** host, on a preview deploy: request `/`, `/library`, `/studio/x/details`, `/settings/security`, a missing asset path, `/sw.js`, `/manifest.webmanifest`. Record status code, body (index.html vs 404), and `content-type`. Test with the SW absent (private window, first visit) and with it installed.
3. Confirm security headers (CSP, HSTS, frame, referrer, permissions) are actually served on each host. **[O]** `_headers` is a Cloudflare Pages/Netlify convention; whether Vercel applies it is unverified, and Vercel would normally need `vercel.json`.
4. Confirm no CSP violations in the console on cold load (theme script, fonts, workers, `blob:` images, provider `connect-src`).
5. Confirm `sw.js` and `index.html` are not served with long-lived cache headers that would trap users on stale builds.
6. Confirm the manifest and icons resolve; confirm `scope`/`start_url` behave after any route change.
7. Do not change production origin or Pages project name during redesign work.
8. Until step 2 passes on every host in use, path routes stay **Open** and hash routes are the default.

---

## 12. Risk register

| ID | Risk | L | I | Mitigation |
|---|---|---|---|---|
| R-01 | Router migration breaks views that assume `activeTab` state or lose state on unmount | M | H | Derive `activeTab` from route; migrate view by view; router tests; smoke on device |
| R-02 | Hash routing is rejected later in favor of path routes without verified fallback → 404s on direct loads | M | H | Keep path routes Open (V-01/V-02); adapter isolates URL scheme |
| R-03 | Stale or mis-targeted AI patches corrupt a card | M | H | `baseHash` guard, transactional apply, undo, tests |
| R-04 | Cleanup/sweep deletes history that backup or sync expects | L | M | Gate sweep on V-10; delete only on card delete first; dry-run log |
| R-05 | Auto-snapshot on restore bloats card records | M | M | Cap, show size, prune policy |
| R-06 | New persisted keys conflict with backup/sync handling | M | M | New keys only; V-10 before shipping restore-route key and `cost_tracker_meta` |
| R-07 | Changing copy overstates security | M | H | Gate on V-10, V-24; keep numbers that are verified |
| R-08 | Moving Enhancer breaks its dependency on Lab scores | M | M | V-06 before P1-4; keep behavior tests |
| R-09 | Floating bottom bar overlaps keyboard on Android | M | M | Device test; hide-on-focus or viewport option |
| R-10 | Token label changes mislead (exact vs estimate) | M | M | State what is known only; V-13 |
| R-11 | Performance regression from added diff and sheets on low-end phones | L | M | Lazy-load diff; measure on a large fixture |
| R-12 | CSP changes break fonts/workers/provider calls | M | H | Hash or external script only; full console check in §11 |
| R-13 | Overlapping visual and structural PRs make regressions hard to bisect | M | M | Small dependency-ordered commits; P0 before P1 |
| R-14 | Origin or project rename strands user IndexedDB data | L | H | No rename now; backup/restore plan if ever needed |
| R-15 | Test coverage gap on Editor/Lorebook/Navigation before refactor | H | M | Write characterization tests before changing those components |
| R-16 | Android uninstall clears local data; users unaware | M | H | Backup prompt; verify behavior (§10) |

(L = likelihood, I = impact: L/M/H.)

---

## 13. Open Questions / Validation Register

**Blockers** must be resolved before the dependent work starts. **Deferrable** items can wait without risking data or correctness.

| ID | Open item | Why it matters | Risk if skipped | Resolve by | Class |
|---|---|---|---|---|---|
| V-01 | Cloudflare Pages: does a direct request to a client route return `index.html` (200) for first visit, refresh, shared link, no SW? | Path routes (Option C) | 404 on deep links | Before P3 path routes; spike in P0-1 | Blocker for path routes only |
| V-02 | Vercel: same test; does the project need a rewrite config? Which host is production? | Same; host choice affects CSP/headers | 404s; wrong assumptions | P0-1 | Blocker for path routes; informs P0-2 |
| V-03 | Does the host serve `public/_headers`? (CF/Netlify convention; Vercel unverified) | Security headers may be absent | Silent loss of CSP and HSTS | P0-1 | Blocker for security claims |
| V-04 | Is the inline theme script actually blocked by the served CSP in a deployed build? | D-03 | Theme flash, or a wasted fix | Before P0-2 | Blocker for P0-2 |
| V-05 | `editor/useFieldRegeneration.tsx` (`pendingFieldEdits`, `renderFieldDiff`) logic | Third patch-review pattern; unify safely | Duplicate or conflicting review UI | Before P1-5 / UX-DET-3 | Blocker for P1-5 |
| V-06 | `CrucibleView`, `useCrucibleRun`, all `crucible/*` panels, `EnhancerView` (rest), Enhancer↔Lab score handoff | Lab IA; Enhancer move; simulator consolidation | Breaking Enhancer; wrong Lab segments | Before P1-4, P2-3, P2-6 | Blocker for those items |
| V-07 | `AssistantView` internals, `assistantSlice`, persisted message/patch shape, `llmAdapter` | Stale-patch guard, chat/enhance modes, copy about egress | Incompatible stored messages | Before P1-4, P1-5 | Blocker |
| V-08 | `schemas/cardSchema.ts`: do lorebook entries have stable IDs; unknown-field handling | Patch targeting; preservation guarantees | Wrong-entry edits | Before P1-5 | Blocker for lorebook targeting |
| V-09 | `io/*` (`converter`, `png`, `charx`, `chub`, `index`) | Import receipts, round-trip claims | Overclaiming preserved/dropped data | Before P2-5 | Blocker for P2-5 |
| V-10 | `io/backup.ts`, `io/p2pSync.ts`: which `settings` keys are exported, redacted, or synced; passkey and sync identifiers | Orphan sweep, new keys, egress copy, invariants inventory | Data loss or false privacy claims | Before H-1 sweep, P1-1 restore key, P2-4 | Blocker for those |
| V-11 | `usePWAUpdate`, `usePWAInstall`, `PwaSection`; `registerType: 'prompt'` UX | Update banner, Settings → App | Stale builds or lost state on update | Before P2-1; observe in P0-9 | Deferrable (Android check is P0) |
| V-12 | `calculateModelCost` fallback matching and unknown-model behavior | Cost honesty | Confident wrong prices | Before P2-4 | Blocker for P2-4 |
| V-13 | `recordUsage` call sites: provider-reported vs estimated usage | Label "API usage" accurately | Mislabeling | Before P2-4 | Blocker for that wording |
| V-14 | `GalleryToolbar`, `GalleryFilterBar`, `GalleryCardsGrid`, `GalleryImportStatus`, empty state; reported truncation and duplicated CTAs | Library redesign | Fixing a non-issue or missing one | Before P1-6 | Blocker for P1-6 |
| V-15 | `src/index.css` tokens, fonts, reduced-motion, contrast values | Token layer and a11y targets | Wrong palette mapping | Before P1-8 | Blocker for P1-8 |
| V-16 | `PortraitGuard` and manifest `orientation: any` | Landscape behavior | Unexpected lock/overlay | Before P2-1; check in §10 | Deferrable |
| V-17 | `ToastContainer`, `AlertDialogModal`, `useDialogStore`, `useModalA11y` coverage | A11y and shared sheet | Inaccessible dialogs/toasts | Before P1-3 sheet work | Blocker for shared sheet |
| V-18 | `PreFlightAuditModal` and `utils/writingLint`: does it make any network/AI call? | "Free / no AI" copy | False claim | Before renaming to "Writing check" | Blocker for that copy |
| V-19 | `ChatPreviewModal`, `DeviceSyncPanel`, `GuideView`, `DecryptionModal`, `PassphraseSetupModal`, `OpenRouterModelPicker` copy and behavior | Settings and modal consistency | Inconsistent copy | Before P2-1 | Deferrable |
| V-20 | `docs/PLATFORM_SUPPORT.md` | Compatibility claims in UI | Overclaiming | Before any compatibility UI | Deferrable |
| V-21 | On-device behavior: back button, keyboard overlap, safe areas, theme-color, install/uninstall data retention, SW update | Core Android target | Shipping unverified PWA behavior | P0-9 baseline; re-run each phase | Blocker for phase sign-off |
| V-22 | Measured cost of `loadCardsFromDb` per autosave and persisted history size per save | H-3, H-5 | Optimizing blindly | Before P1-7 | Blocker for P1-7 |
| V-23 | Reproduce D-05 and D-13 (code-reading findings) | Confirms priority and test design | Wrong fix | In P0-3 / P1-2 test work | Deferrable (tests will prove) |
| V-24 | Is there any passphrase recovery path? | Copy "can't be recovered" | False statement | Before P0-5 copy | Blocker for that sentence |
| V-25 | Full contents of existing tests (known by file name only) | Avoid duplicate or conflicting tests | Redundant effort | During P0 | Deferrable |
| V-26 | Which `lorebooks` UI write path, if any, is wanted (D-14) | Library lorebook shelf | Shipping an empty shelf | Before P3 shelf | Deferrable |
| V-27 | Hosting origin and project naming plan (`wrangler.toml` still `cardcrucible`) | Data stranding on rename | Lost user data | Before any rename | Deferrable (do not rename now) |

---

## 14. Verification statement

**Verified** (read in source or project docs at commit `f173641`): the items labelled **[V]** above, including: no routing/history API; Navigation/sub-nav structure; store and slice behavior for undo, autosave, delete, snapshot restore; patch schema, apply logic, and preview panel; PatchPreviewPanel and Settings security/profile copy and unlock logic; token tracker shape and PayloadView token display; Details section order; Lorebook data source, layers, and missing write path for `lorebooks`; Vite/PWA config; `_headers` CSP; inline theme script; CI; test file list; roadmap, status, vision, and testing docs.

**Open** (not verified): everything labelled **[O]**, tracked in §13 — notably hosting fallback and headers on Vercel and Cloudflare Pages, deployed CSP effect, Android device behavior, the uninspected editor regeneration logic, Lab and Assistant internals, import/export and backup layers, PWA update behavior, cost fallback behavior, Library toolbar and empty-state details, token/CSS values, and all performance measurements.

**Initial repository change:** the first spec commit added only this document. Subsequent P0 changes are listed in §15. CI verifies the committed code paths; deployed-host and Android-device behavior remain unverified.

---

## 15. P0 implementation log — 2026-10-29

The design remains a draft. Code changes do not close a deployment/device verification gate by themselves.

### Implemented

- **P0-3 — Atomic AI edits:** the store computes the complete edit before changing card or history state. Assistant and Enhancer apply selected patches as one undo step, retain suggestions on failure, and present success/error feedback with a guarded Undo action.
- **P0-6 / P0-7 — History safety:** single and bulk card deletion remove only the matching `editor_history_<uuid>` key in the deletion transaction. Snapshot restore keeps the pre-restore state undoable and updates the persisted history and active record.
- **P0-5 — Security copy and unlock:** replaced “zero-knowledge” and “local storage” phrasing with accurate IndexedDB/AES-GCM/PBKDF2 descriptions, clarified passphrase timing and passkey-based unlock, and added an unlock path that works with zero connection profiles.
- **P0-4 — Accessible completeness checklist:** replaced the title-only warning with a touch-sized checklist button, labelled issue list, close control, Escape dismissal with focus return, and outside-tap dismissal.
- **P0-8 / P0-10 — Maintenance and tests:** removed the internal “Phase 6” badge, aligned the testing-strategy document with CI, and added persistence invariant tests for the database/schema, settings keys, undo-record shape, usage-record shape, and encrypted-key prefix.

The [CI workflow for commit `c34814e`](https://github.com/KarlMuzen/RoleplayForge/actions/runs/40757971294) passed lint, tests, and the production PWA build. Its tests cover patch atomicity and undo, delete/history cleanup, snapshot restore, zero-profile unlock, completeness checklist behavior, and persistence invariants.

### Still open — do not infer from CI

- **V-01 / V-02 — Hosting fallback:** Vercel reports project `rpforge` with SSO protection enabled for generated domains. The connected Vercel fetch attempt was denied with HTTP 403 before the route could be tested. Root/deep-link first visit and refresh therefore remain unverified; no routing changes were made.
- **V-03 — Response headers:** `public/_headers` is the [Cloudflare Pages header convention](https://developers.cloudflare.com/pages/configuration/headers/). Vercel documents custom response headers through [`vercel.json`](https://vercel.com/docs/headers); no `vercel.json` or project route rules were found. Runtime headers still need checking from the intended public origin.
- **V-04 / P0-2 — CSP/theme bootstrap:** the inline theme script and `script-src 'self'` in `public/_headers` remain. Because deployed header delivery and console behavior could not be observed, neither CSP nor bootstrap was changed.
- **P0-9 / V-21 — Android smoke test:** installed-PWA back, keyboard, safe-area, theme-color, update, and uninstall/reinstall behavior still require a physical Android test.

Path-based routing, CSP changes, origin/database renames, orphan-history sweeping, and P1 navigation redesign remain gated and have not been started.
