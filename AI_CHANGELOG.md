# AI Changelog

Auto-maintained by the AI Studio build agent. Every response that changes code appends an entry here, newest on top. See project custom instructions for the required format.

---
## [2026-08-18T06:02:00Z] P2P Sync Chunk Boundary Guard & API Key Encryption Indicator
**Prompt intent:** Fix potential unhandled RangeError in p2pSync chunk processing by adding boundary check when `receivedLength + chunk.byteLength > expectedLength`, add UI helper in ConnectionProfilesSection indicating API key encryption at rest status based on master passphrase setup, and clean up stale changelog TODO.
**Files touched:** src/io/p2pSync.ts, test/p2pSync.test.ts, src/components/settings/ConnectionProfilesSection.tsx, src/components/SettingsView.tsx, AI_CHANGELOG.md
**What changed:**
- `src/io/p2pSync.ts`: In `receiveBytes()`, guarded against malformed or oversized chunks that exceed `expectedLength`, resetting receive state cleanly and invoking `onError()` instead of letting `Uint8Array.prototype.set` throw a RangeError.
- `test/p2pSync.test.ts`: Added unit test covering oversized chunk rejection and state reset in `receiveBytes()`.
- `src/components/settings/ConnectionProfilesSection.tsx` & `SettingsView.tsx`: Added subtle helper text under the API Key input indicating whether keys are encrypted with AES-GCM via Master Passphrase or plaintext until configured.
- `AI_CHANGELOG.md`: Removed stale TODO note regarding `DiagnosticScorePanel.tsx` and `CrucibleView.tsx` (the logic was already shared via import).
**New deps:** none
**Schema/security touched:** no
**Tests:** Unit tests added in `test/p2pSync.test.ts`, verified via `compile_applet` and linter.
**Known risk/TODO:** none

## [2026-08-18T05:18:00Z] Gallery Toolbar Side-by-Side Buttons & Empty State Action Simplification
**Prompt intent:** Align "Import Card" and "Export Cards" buttons side-by-side on all viewports in GalleryToolbar, and simplify the empty state in GalleryCardsGrid to display only the "Create Character" button.
**Files touched:** src/components/gallery/GalleryToolbar.tsx, src/components/gallery/GalleryCardsGrid.tsx, AI_CHANGELOG.md
**What changed:**
- `src/components/gallery/GalleryToolbar.tsx`: Updated the button container to use non-wrapping flex layout (`flex items-center gap-2 sm:gap-3 w-full sm:w-auto`) and each split button to use responsive flex-grow (`flex-1 sm:flex-initial min-w-0`), guaranteeing side-by-side alignment even on narrow mobile screens without breaking on desktop.
- `src/components/gallery/GalleryCardsGrid.tsx`: Removed the redundant "Import Card" button from the empty state, leaving only "Create Character" to keep the call-to-action clean and non-repetitive.
**New deps:** none
**Schema/security touched:** no
**Tests:** Verified via `compile_applet` and test suite.
**Known risk/TODO:** none

## [2026-08-18T00:00:00Z] Require Confirmation Before Deleting a Connection Profile
**Prompt intent:** Manual code audit of settings/crucible sub-panels ahead of a tester round flagged that ConnectionProfilesSection's delete button fired immediately with no confirmation, unlike every other destructive action in the app (SecuritySection, CostTrackerSection, EditorView, AssistantView all gate deletes behind `useDialogStore.showConfirm`). Fix the inconsistency.
**Files touched:** src/components/settings/ConnectionProfilesSection.tsx, test/ConnectionProfilesSection.test.tsx, AI_CHANGELOG.md
**What changed:**
- `src/components/settings/ConnectionProfilesSection.tsx`: the profile-card delete button now calls `useDialogStore.getState().showConfirm(...)` (danger variant, profile name in the message) and only calls `deleteProfile(uuid)` if the user confirms.
- `test/ConnectionProfilesSection.test.tsx`: new test suite asserting deletion is blocked until confirmation, and that cancelling the dialog leaves the profile (and its stored API key) untouched.
**New deps:** none
**Schema/security touched:** no (UI-only guard; no change to how API keys are stored/encrypted)
**Tests:** New suite added; full `npm run test` not executed in this sandbox (no network access to install dependencies) - run it before merging.
**Known risk/TODO:** none
## [2026-08-17T12:38:00Z] Backup Merge-Mode Security Isolation & PWA SPA Navigation Fallback
**Prompt intent:** Fix critical data integrity bug in backup/restore merge path so security settings are preserved on receiver, update DeviceSyncPanel confirmation copy, add backup test suite, and configure PWA navigateFallback for offline routing.
**Files touched:** src/io/backup.ts, src/components/DeviceSyncPanel.tsx, vite.config.ts, test/backup.test.ts, AI_CHANGELOG.md
**What changed:**
- `src/io/backup.ts`: In `restoreFullBackup()`, when `mode === 'merge'`, explicitly skip writing `crypto_salt`, `crypto_hash`, `passkey_credential_id`, `passkey_wrapped_key`, and `passkey_prf_salt` so receiving devices retain their local master passphrase salt/hash and passkey credentials. In `mode === 'overwrite'`, all settings are replaced as intended.
- `src/components/DeviceSyncPanel.tsx`: Updated the receiver confirmation copy to clarify that connection profile API keys are excluded from the sync package and must be re-entered, and that the device's passphrase/passkey remain unchanged.
- `vite.config.ts`: Added `navigateFallback: '/index.html'` and `navigateFallbackDenylist: [/^\/manifest\.webmanifest$/, /^\/_headers$/]` to VitePWA's workbox config for offline SPA app-shell navigation.
- `test/backup.test.ts`: Created new test suite covering merge-mode security settings preservation, overwrite-mode full replacement, and card/lorebook merge behavior.
**New deps:** none
**Schema/security touched:** yes (Prevented merge-mode backup/sync from clobbering receiver cryptographic salt, hash, and passkey credentials)
**Tests:** All 117 tests passing across 25 suites (including test/backup.test.ts), build and linter passing
**Known risk/TODO:** none

## [2026-08-17T07:33:00Z] Allow Same-Origin Camera in Permissions-Policy Header
**Prompt intent:** Update `Permissions-Policy` in `public/_headers` to allow `camera=(self)` for QR-code device pairing in `DeviceSyncPanel.tsx` while keeping other permissions restricted.
**Files touched:** public/_headers, AI_CHANGELOG.md
**What changed:**
- Changed `Permissions-Policy: camera=(), ...` to `Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=()` in `public/_headers`.
**New deps:** none
**Schema/security touched:** yes (Permissions-Policy header updated)
**Tests:** All 115 vitest tests passing, build compiled cleanly
**Known risk/TODO:** none

## [2026-08-17T07:25:00Z] PWA Security Hardening & CSP HTTP Header Migration
**Prompt intent:** Implement PWA security hardening: switch SW registration from inline to external script, remove CSP meta tag in favor of strict Cloudflare Pages `_headers` file, request persistent storage on first successful unlock, and add SW update available prompt toast.
**Files touched:** vite.config.ts, index.html, public/_headers, src/store/slices/sessionSlice.ts, src/store/useToastStore.ts, src/components/ToastContainer.tsx, src/hooks/usePWAUpdate.ts, src/types/pwa.d.ts, src/utils/orientationLock.ts, src/main.tsx, src/App.tsx, AI_CHANGELOG.md
**What changed:**
- `vite.config.ts`: Updated `VitePWA` config to `injectRegister: 'script'` and `registerType: 'prompt'`.
- `index.html`: Removed `<meta http-equiv="Content-Security-Policy">` tag and moved inline portrait lock script to `src/utils/orientationLock.ts` (invoked in `src/main.tsx`) so HTML contains no inline scripts.
- `public/_headers`: Created Cloudflare Pages headers file with tightened CSP (`script-src 'self'`, `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `connect-src 'self' https: wss:`, `frame-ancestors 'none'`, etc.) and security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, `Permissions-Policy`).
- `src/store/slices/sessionSlice.ts`: Added `requestPersistentStorageOnce()` to best-effort call `navigator.storage?.persist()` once per session upon successful unlock via passphrase, passkey, or initial setup.
- `src/store/useToastStore.ts` & `src/components/ToastContainer.tsx`: Added support for toast actions (`action?: { label: string; onClick: () => void }`).
- `src/hooks/usePWAUpdate.ts` & `src/App.tsx`: Wired `useRegisterSW` to show a non-intrusive "Update Available" toast with a "Reload" action that invokes `updateServiceWorker(true)`.
**New deps:** none
**Schema/security touched:** yes (CSP tightened to HTTP header, persistent storage requested on unlock)
**Tests:** All vitest test suites passing (115/115 tests), build and lint passing cleanly
**Known risk/TODO:** none

## [2026-08-17T03:04:00Z] Extract VariantComparisonPanel Component from CrucibleView
**Prompt intent:** Extract inline Side-by-side Variant Comparison JSX block from `CrucibleView.tsx` into `src/components/crucible/VariantComparisonPanel.tsx` with dedicated props, preserving exact behavior.
**Files touched:** src/components/crucible/VariantComparisonPanel.tsx, src/components/CrucibleView.tsx, AI_CHANGELOG.md
**What changed:**
- Created `src/components/crucible/VariantComparisonPanel.tsx` receiving `variantResultsA`, `variantResultsB`, `cards`, `variantCardAUuid`, `variantCardBUuid`, and `rootUuid`.
- Replaced the inline side-by-side probe rendering block in `CrucibleView.tsx` with `<VariantComparisonPanel ... />`.
- Re-exported `VariantComparisonPanel` in `CrucibleView.tsx`.
**New deps:** none
**Schema/security touched:** no
**Tests:** test/CrucibleView.test.tsx (all 2 tests passed)
**Known risk/TODO:** none

## [2026-08-17T02:56:00Z] Modularize CrucibleView into Dedicated Crucible Sub-components
**Prompt intent:** Split `src/components/CrucibleView.tsx` into modular sub-components in `src/components/crucible/` adhering to existing folder conventions, turning `CrucibleView.tsx` into a composer using `useCrucibleRun.ts` as-is.
**Files touched:** src/components/crucible/TokenBudgetPanel.tsx, src/components/crucible/TrustScoreReportPanel.tsx, src/components/crucible/ScenarioAutoRunnerPanel.tsx, src/components/crucible/LorebookSimulatorPanel.tsx, src/components/CrucibleView.tsx, AI_CHANGELOG.md
**What changed:**
- Created `src/components/crucible/TokenBudgetPanel.tsx`: Token Budget Breakdown section with progress bar and field-by-field token usage.
- Created `src/components/crucible/TrustScoreReportPanel.tsx`: Card variant comparison selector, model comparison cards, multi-profile selector, and single-profile Trust Score Badge report (with plain-text report copy and visual canvas badge download).
- Created `src/components/crucible/ScenarioAutoRunnerPanel.tsx`: Simulated Scenario & Tester Personas Auto-Runner wrapping `ScenarioPicker` and `TranscriptViewer`.
- Created `src/components/crucible/LorebookSimulatorPanel.tsx`: Lorebook Activation Simulator with text test input, entry activation rules, and keyword match triggers.
- Refactored `src/components/CrucibleView.tsx` into a clean composer wiring state and handlers while preserving all exports and behavior with `useCrucibleRun.ts`.
**New deps:** none
**Schema/security touched:** no
**Tests:** test/CrucibleView.test.tsx, test/crucibleBadgeExporter.test.ts (all 24 test suites / 115 tests passed)
**Known risk/TODO:** none

## [2026-08-17T02:52:00Z] Modularize GalleryView into Dedicated Gallery Sub-components
**Prompt intent:** Split monolithic `src/components/GalleryView.tsx` into modular sub-components under `src/components/gallery/` without altering state management or runtime behavior.
**Files touched:** src/components/gallery/galleryUtils.ts, src/components/gallery/GalleryToolbar.tsx, src/components/gallery/GalleryImportStatus.tsx, src/components/gallery/GalleryFilterBar.tsx, src/components/gallery/GalleryCardsGrid.tsx, src/components/GalleryView.tsx, AI_CHANGELOG.md
**What changed:**
- Created `src/components/gallery/galleryUtils.ts`: extracted `getCardCoverUrl`, `getCardRating`, and duplicate choice types.
- Extracted `GalleryToolbar.tsx`: Search input, import & export buttons, hidden file input handles, and dropdown menus for single file, bulk ZIP, folder, and JSON bundle operations.
- Extracted `GalleryImportStatus.tsx`: Drag & drop upload dropzone, dismissible import success/error/warning alerts (with expandable notice logs), duplicate detection resolution modal, and Chub.ai import modal.
- Extracted `GalleryFilterBar.tsx`: Tag filter pills, rating filter pills (All, SFW, NSFW, Unrated with data-testids), and visual overflow indicators.
- Extracted `GalleryCardsGrid.tsx`: Bulk operations toolbar (multi-card export/delete), draggable/sortable card items (`SortableCard`), card loading skeletons, empty state, and DnD context wrapper.
- Refactored `GalleryView.tsx`: Lightweight composer component wiring store state, drag & drop sensors, and file handlers while re-exporting `getCardRating` and `getCardCoverUrl` for backward compatibility.
**New deps:** none
**Schema/security touched:** no
**Tests:** vitest run (7/7 tests in test/GalleryView.test.tsx passed, all 24 test suites / 115 tests passed)
**Known risk/TODO:** none
---
## [2026-08-17T02:42:00Z] Modularize SettingsView into Dedicated Section Components
**Prompt intent:** Split monolithic `src/components/SettingsView.tsx` into modular sub-components under `src/components/settings/` preserving exact state management and behavior.
**Files touched:** src/components/settings/SecuritySection.tsx, src/components/settings/ConnectionProfilesSection.tsx, src/components/settings/CostTrackerSection.tsx, src/components/settings/PwaSection.tsx, src/components/settings/BackupRestoreSection.tsx, src/components/SettingsView.tsx, AI_CHANGELOG.md
**What changed:**
- Extracted `SecuritySection.tsx`: Master Passphrase & Encryption card and WebAuthn PRF passkey fast unlock block.
- Extracted `ConnectionProfilesSection.tsx`: Configured profile list, active profile status bar, test triggers, and the 3-step add/edit form (Basic & Credentials, Generation Parameters, System Injections & Proxy tabs).
- Extracted `CostTrackerSection.tsx`: Running Cost Estimate tracker table, cost calculations, and reset actions.
- Extracted `PwaSection.tsx`: Progressive Web App status, installation prompt trigger, and desktop/mobile help guides.
- Extracted `BackupRestoreSection.tsx`: Database backup export/restore controls and the export key safety confirmation modal.
- Streamlined `SettingsView.tsx` into a thin composer rendering these sections and passing store state and handlers via props.
**New deps:** none
**Schema/security touched:** no
**Tests:** vitest run
**Known risk/TODO:** none
---
## [2026-08-17T02:37:00Z] Mobile Touch Target & Accessibility Pass
**Prompt intent:** Audit and upgrade icon buttons and interactive controls across the entire app to meet mobile touch accessibility standards (min 40x40px touch targets, active state feedback, aria-labels, and safe area handling).
**Files touched:** index.html, src/components/AlertDialogModal.tsx, src/components/ChatPreviewModal.tsx, src/components/DecryptionModal.tsx, src/components/Navigation.tsx, src/components/PassphraseSetupModal.tsx, src/components/PreFlightAuditModal.tsx, src/components/ToastContainer.tsx, src/components/GalleryView.tsx, src/components/DeviceSyncPanel.tsx, src/components/crucible/TranscriptViewer.tsx, src/components/crucible/ProbeVectorPanel.tsx, src/components/crucible/ScenarioPicker.tsx, src/components/CrucibleView.tsx, src/components/OpenRouterModelPicker.tsx, src/components/editor/ExportVerifyModal.tsx, src/components/editor/GreetingsSection.tsx, src/components/editor/AdvancedPromptsSection.tsx, src/components/LorebookView.tsx, src/components/EnhancerView.tsx, src/components/SettingsView.tsx, src/components/PortraitGuard.tsx, AI_CHANGELOG.md
**What changed:**
- Updated viewport meta in `index.html` allowing `maximum-scale=5.0` to eliminate WCAG zoomability issues.
- Updated Navigation and fixed floating elements to respect `env(safe-area-inset-bottom,0px)` on notched mobile devices.
- Systematically upgraded icon buttons, delete triggers, duplicate/restore actions, modal close triggers, and search clear buttons across Gallery, Crucible, Lorebook, Enhancer, Editor, Settings, and Modals with standard touch targets (`min-w-9 min-h-9` / `min-w-10 min-h-10` with flex alignment, `touch-fast`, and `active:scale-95`).
- Added descriptive `aria-label` tags to icon-only buttons for screen-reader accessibility.
**New deps:** none
**Schema/security touched:** no
**Tests:** npm run test
**Known risk/TODO:** none
---
## [2026-08-17T02:22:00Z] Bloat Cleanup & Binary Encoding Consolidation
**Prompt intent:** Remove unused workbox-window dependency and consolidate duplicated binary, hex, and base64 encoding helpers into a single utility module.
**Files touched:** package.json, package-lock.json, src/utils/binaryEncoding.ts, src/utils/crypto.ts, src/utils/passkeyCrypto.ts, src/utils/encoding.ts, src/io/backup.ts, test/binaryEncoding.test.ts, AI_CHANGELOG.md
**What changed:**
- Removed unused `workbox-window` from `package.json` and `package-lock.json`.
- Created `src/utils/binaryEncoding.ts` as the single source of truth exporting `buf2hex`, `hex2buf`, `buf2b64`, `b642buf`, `utf8ToBase64`, and `base64ToUtf8`.
- Updated `src/utils/crypto.ts`, `src/utils/passkeyCrypto.ts`, `src/utils/encoding.ts`, and `src/io/backup.ts` to import from `src/utils/binaryEncoding.ts` and removed redundant implementations.
- Added unit test suite in `test/binaryEncoding.test.ts` covering all buffer, hex, and UTF-8/Base64 transformations including unicode strings, malformed hex, and empty buffers.
**New deps:** removed workbox-window
**Schema/security touched:** no
**Tests:** test/binaryEncoding.test.ts
**Known risk/TODO:** none
---
## [2026-08-17T02:10:00Z] Unit Test Coverage for Sync Transport and QR Codec
**Prompt intent:** Add unit test coverage for the WebRTC sync transport layer and QR codec.
**Files touched:** test/p2pSync.test.ts, test/qrCodec.test.ts, AI_CHANGELOG.md
**What changed:**
- Created comprehensive test suite in `test/p2pSync.test.ts` mocking `RTCPeerConnection` and `RTCDataChannel` to test `createOffer`, `createAnswerFromOffer`, `applyAnswer`, schema validation, and `sendBytes`/`receiveBytes` round-trips (including zero-length payloads, multi-chunk transfers, and oversized length header rejections).
- Created `test/qrCodec.test.ts` mocking `QRCode.toDataURL` and `jsQR`/`BarcodeDetector` to test QR data URL generation, oversized payload rejection, native `BarcodeDetector` scanning, fallback `jsQR` scanning, and scanner lifecycle cleanup.
**New deps:** none
**Schema/security touched:** no
**Tests:** test/p2pSync.test.ts, test/qrCodec.test.ts
**Known risk/TODO:** none
---
## [2026-08-17T02:00:00Z] Hardened QR WebRTC Device Clone Sync
**Prompt intent:** Harden and complete the QR device-clone sync feature with real backup integration, progress bars, confirmation, size guards, and single-STUN configuration
**Files touched:** src/io/p2pSync.ts, src/io/backup.ts, src/components/DeviceSyncPanel.tsx, src/components/P2PDemo.tsx (deleted), src/components/SettingsView.tsx, test/p2pSync.test.ts, AI_CHANGELOG.md
**What changed:**
- Fixed bug in `p2pSync.ts` `receiveBytes()` where 0-length header did not reset `expectedLength = -1`, which corrupted subsequent incoming messages.
- Added `MAX_SYNC_PAYLOAD_SIZE` (200MB) guard in `receiveBytes()` to abort oversized streams before allocation.
- Reduced STUN servers to a single Google STUN server to minimize candidate count and keep SDP sizes within QR capacity.
- Added `parseBackupPayload()` helper in `backup.ts` to inspect received archives before database merge.
- Replaced demo payload in `P2PDemo.tsx` by renaming to `DeviceSyncPanel.tsx` and connecting `createFullBackupZip(false)` and `restoreFullBackup(bytes, 'merge')`.
- Implemented real-time transmission and receiving progress bars, pre-import review modal (displaying card/lorebook counts), and import result breakdown with error/skip reporting.
- Wrapped QR generation in try/catch to display clean error feedback on oversized SDP payloads.
**New deps:** none
**Schema/security touched:** no
**Tests:** test/p2pSync.test.ts
**Known risk/TODO:** Restrictive symmetric NATs without direct UDP routing will require devices to be on the same WiFi / accessible network path since TURN is intentionally excluded.
---
## [2026-08-17T01:36:00Z] P2P Sync Connection Timeout Fix
**Prompt intent:** Fix "Connection timeout" errors in the WebRTC P2P Sync infrastructure.
**Files touched:** src/io/p2pSync.ts, AI_CHANGELOG.md
**What changed:**
- Increased WebRTC data channel connection timeout in `createOffer` and `createAnswerFromOffer` from an overly aggressive 25 seconds to 60 seconds to allow human users adequate time to perform the two-step manual QR scanning exchange.
- Added synchronous `.readyState === 'open'` checks to correctly resolve channel promises immediately if the datachannel transitions to the open state before the `onopen` listener is attached.
**New deps:** none
**Schema/security touched:** no
**Tests:** none needed — modifies timeout and race-condition checks in IO layer.
**Known risk/TODO:** Users exceeding 60 seconds scanning QRs will still hit the connection timeout.
---
## [2026-08-17T01:29:00Z] QR-Paired WebRTC P2P Sync Infrastructure
**Prompt intent:** Build QR-paired WebRTC device pairing and generic reliable byte-transport layer with a small demo payload
**Files touched:** package.json, package-lock.json, src/utils/qrCodec.ts, src/io/p2pSync.ts, src/components/P2PDemo.tsx, src/components/SettingsView.tsx, AI_CHANGELOG.md
**What changed:**
- Added `qrcode` for reliable canvas-free data URL generation and `jsqr` as fallback for unsupported native BarcodeDetector APIs (essential for iOS Safari).
- Created `qrCodec.ts` bridging `jsqr` and native `BarcodeDetector` into a requestAnimationFrame sampling loop.
- Built `p2pSync.ts` providing STUN-only WebRTC primitives (`createOffer`, `createAnswerFromOffer`, `applyAnswer`).
- Implemented robust chunked byte transport in `p2pSync.ts` (`sendBytes`, `receiveBytes`) respecting 64KB `bufferedAmountLowThreshold` with 16KB fragments and 4-byte total-length LE framing.
- Built a minimal `P2PDemo.tsx` interface under SettingsView to visually demonstrate end-to-end payload transmission.
**New deps:** qrcode@^1.5.4 (QR generation), jsqr@^1.4.0 (fallback QR decoding), @types/qrcode (dev)
**Schema/security touched:** no — WebRTC datachannels are natively encrypted; STUN operates externally but uses safe public infrastructure without brokering traffic (no TURN).
**Tests:** none needed — infrastructure is primitive-level, awaiting db/backup coupling and full module testing
**Known risk/TODO:** P2P reliability on restrictive symmetric NATs will be poor since TURN is disabled by architectural choice
---
## [2026-08-17T01:10:00Z] Optional WebAuthn PRF Passkey Fast Unlock
**Prompt intent:** Add optional passkey (WebAuthn PRF) unlock as a fast alternative to the master passphrase without replacing passphrase as sole root of trust
**Files touched:** src/utils/passkeyCrypto.ts, src/store/slices/types.ts, src/store/slices/sessionSlice.ts, src/components/DecryptionModal.tsx, src/components/SettingsView.tsx, test/passkeyCrypto.test.ts, test/sessionPasskeySlice.test.ts, AI_CHANGELOG.md
**What changed:**
- Implemented pure WebAuthn PRF cryptography utilities in passkeyCrypto.ts using HKDF-SHA256 and AES-256-GCM wrapping of master key bytes
- Added passkey support detection, enrollment, unlock, and removal actions to sessionSlice.ts with Dexie settings persistence
- Ensured clearPassphrase() purges passkey credential and wrapped key settings rows alongside salt/hash
- Added explicit "Unlock with Passkey" button with Fingerprint icon in DecryptionModal.tsx with graceful cancellation fallback
- Added Passkey Unlock management card in SettingsView.tsx visible when unlocked and supported on the device
**New deps:** none
**Schema/security touched:** yes — stored wrapped key bytes in local settings encrypted with HKDF derived key from authenticator PRF output; passphrase remains sole root of trust
**Tests:** test/passkeyCrypto.test.ts, test/sessionPasskeySlice.test.ts
**Known risk/TODO:** none
---
## [2026-08-17T00:45:00Z] Crucible Resilience Tier Consolidation & Achievement Styling
**Prompt intent:** Consolidate divergent Crucible resilience tier thresholds into a single source of truth and add achievement-tier visual styling
**Files touched:** src/utils/crucibleTiers.ts, src/utils/crucibleBadgeExporter.ts, src/components/CrucibleView.tsx, test/crucibleTiers.test.ts, AI_CHANGELOG.md
**What changed:**
- Created crucibleTiers.ts exporting getResilienceTier() mapping score percentages to unified tiers (untested, vulnerable, moderate, verified, battle-hardened, flawless)
- Replaced divergent inline threshold calculations in crucibleBadgeExporter.ts and CrucibleView.tsx with getResilienceTier
- Added canvas visual flourishes (golden radial glow + star for Flawless Victory; cyan radial glow + sparkle for Battle-Hardened) in badge PNG export
- Added unified tier badges in CrucibleView single-profile Trust Badge panel and model comparison rows
**New deps:** none
**Schema/security touched:** no
**Tests:** test/crucibleTiers.test.ts
**Known risk/TODO:** none
---
## [2026-08-17T00:14:00Z] Crucible Trust Score Badge Image Export
**Prompt intent:** Add image export for Crucible Trust Score report using Web Share API and canvas rendering
**Files touched:** src/components/CrucibleView.tsx, src/utils/crucibleBadgeExporter.ts, src/utils/visualCardExporter.ts, test/crucibleBadgeExporter.test.ts, AI_CHANGELOG.md
**What changed:**
- Extracted inline report data calculation in CrucibleView into a memoized trustReportData value shared by text copy and image export
- Exported drawRoundRect and wrapTextLines canvas helpers from visualCardExporter.ts
- Created crucibleBadgeExporter.ts with renderTrustBadgeCanvasBytes for rendering shareable dark-themed badge PNGs
- Added "Download Badge" action button with Web Share API support and graceful download fallback
**New deps:** none
**Schema/security touched:** no
**Tests:** test/crucibleBadgeExporter.test.ts
**Known risk/TODO:** none
---
## [seed] Log initialized
**Prompt intent:** n/a — log created for AI-Studio-driven development tracking
**Files touched:** AI_CHANGELOG.md
**What changed:** created this file
**New deps:** none
**Schema/security touched:** no
**Tests:** none needed
**Known risk/TODO:** none
---