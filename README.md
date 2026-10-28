# CardCrucible — Character Card Studio & Lab

CardCrucible is an open-source, client-only browser application for creating, editing, testing, and stress-testing AI roleplay character cards and lorebooks. It adheres strictly to the **Character Card V2 and V3 specifications**, providing a comprehensive suite of authoring tools, a structured AI patch execution system, a multi-model Crucible testing lab, and a zero-knowledge encrypted local storage engine.

---

## 🏛️ Client-Side Architecture & Privacy

CardCrucible is built as a **100% client-side Single Page Application (SPA)** that runs entirely within your browser runtime.

- **Zero Server-Side Storage**: There are no remote application backends, cloud databases, or telemetry servers collecting, storing, or processing your character cards, lorebooks, chat logs, or connection settings.
- **Direct LLM Provider Connectivity**: When performing prompt testing, generating patches, or chatting with characters, API requests are dispatched directly from your browser to your chosen LLM provider (Google Gemini, OpenAI, Anthropic, OpenRouter, or local Ollama endpoints).
- **Full Offline & Local Capability**: CardCrucible can run entirely offline for card authoring and lorebook management, saving all data directly into browser local storage.

---

## 📱 Progressive Web App

CardCrucible is packaged as a fully installable **Progressive Web App (PWA)**:

- **Standalone Installation**: Installable directly as a standalone app on Android and desktop Chromium browsers (via Chrome/Edge "Add to Home Screen" or "Install app").
- **Offline Authoring**: Once installed and cached by the Service Worker, the full card authoring suite, lorebook manager, writing linter, and local history tools function completely offline without an active network connection.
- **No App Store Requirement**: Delivers native-like app capabilities directly from the web without requiring an app store download.
- **Platform Verification**: PWA installation and offline service worker operation have been verified on Android (Chrome) and desktop Chromium browsers. iOS Safari PWA support is currently untested.

---

## 🔒 IndexedDB & Passphrase Security Architecture

All persistent application state—including character card drafts, lorebooks, assistant chat sessions, and connection profiles—is stored locally in your browser's **IndexedDB** database (managed via Dexie).

### Security Implications of Browser Storage

Standard browser IndexedDB storage is unencrypted at rest within the user's browser profile directory. On a shared or unencrypted filesystem, plaintext data in IndexedDB can potentially be accessed by:
1. Physical device inspectors or malicious local software.
2. Rogue or overly permissive browser extensions running in the same browser context.
3. Unencrypted local backups or exported browser profile folders.

To counteract these vectors, CardCrucible enforces a **Zero-Knowledge Master Passphrase Security Model** for sensitive credentials (API keys).

---

### 🛡️ Master Passphrase Encryption Engine

When storing LLM API keys in Connection Profiles, CardCrucible supports establishing an optional **Master Passphrase**:

- **AES-256-GCM Cryptography**: API keys are encrypted at rest using AES-256-GCM with cryptographically safe 96-bit Initialization Vectors (`enc.v1.<iv>.<ciphertext>`).
- **PBKDF2 Key Derivation**: The encryption key is derived from your passphrase using PBKDF2 with SHA-256 and **600,000 iterations** alongside a 16-byte cryptographically secure random salt (`crypto.getRandomValues`).
- **Zero-Knowledge Verifier**: Passphrase validation uses HMAC-SHA-256 over a static verifier payload (`CardCrucibleVerifier`). Neither your plaintext passphrase nor your derived raw key is ever saved to disk.
- **Volatile Memory Lifespan**: Decrypted `CryptoKey` handles exist solely in volatile WebCrypto memory during an active unlocked session. Locking the session or closing/reloading the browser tab immediately purges all keys from memory.
- **Passphrase Removal & Sanitization**: Removing a Master Passphrase automatically purges all encrypted API key entries from IndexedDB to ensure no orphaned encrypted credentials remain on disk.

#### ⚠️ Security Considerations & Passphrase Loss
- **No Account Recovery**: Because encryption is strictly zero-knowledge and client-side, **there is no reset mechanism or cloud backup** for a lost Master Passphrase. If you forget your passphrase, encrypted API keys cannot be recovered and must be re-entered.
- **Scope of Protection**: The Master Passphrase encrypts API credentials. Character card text, lorebook entries, and general app settings remain stored as unencrypted local drafts in IndexedDB for instant UI responsiveness and local offline access.

---

## ✨ Full Feature Overview

### 1. Gallery & Workspace Management
- **Card Gallery**: Grid view with real-time text search, tag filtering, SFW/NSFW toggles, and multi-field sorting (name, date updated, tags).
- **Import Formats**: Import cards from PNG image files (containing `chara` V2 or `ccv3` V3 tEXt chunks), JSON files (`.json`), and CHARX archives (`.charx` / `.zip`). Supports single-file upload, bulk ZIP extraction, and folder scanning.
- **Chub.ai Direct Import**: Directly import public cards from Chub.ai by pasting a character URL (e.g. `https://chub.ai/characters/...`) or character path (`username/character-name`). The card PNG and embedded metadata are fetched and parsed directly into your local gallery.
- **Export Formats**: Export to V2/V3 spec-compliant PNG files, JSON cards, or standalone CHARX archives with bundled assets.
- **History & Snapshots**: Automated version snapshots with restore capabilities and multi-step undo/redo history persisted across sessions.

### 2. Character Card V2/V3 Authoring Studio
- **Complete Field Support**: Edit all specification fields: Name, Description, Personality, Scenario, First Message (Greeting), Alternate Greetings, Group-Only Greetings, Message Examples (`mes_example`), System Prompt Overrides, Post-History Instructions, Creator Notes, Character Version, Creator, and Custom Tags.
- **Asset Manager**: Manage embedded avatar images, secondary character gallery images, and custom background art for CHARX archives.
- **Card Variant / A-B Comparison System**: Fork any character card into named variants to experiment with alternative greetings, modified system instructions, or different token allocations. Variants can be edited independently and compared side by side in the Crucible under identical scenario benchmarks.
- **Internal Consistency & Writing Auditor**: Client-side heuristic analysis scans card drafts to identify contradictions between stated personality traits and dialog examples/greetings, flag missing essential sections, and compute real-time token budgets without sending data to external servers.

### 3. Lorebook / Character Book Manager
- **Entry Management**: Create and edit lorebook entries with primary and secondary activation keywords, regex matching options, insertion order, depth, and selective activation toggles.
- **Conflict & Overlap Detector**: Scan lorebooks against card content to identify keyword collisions, unused entries, or missing dependencies.

### 4. Real Structured Patch System (Assistant & Enhancer)
- **Zod-Validated Patch Engine**: Replaces unstructured prose outputs with a type-safe `cardPatchSchema` JSON format for precise field and lorebook updates (`replace` or `append`).
- **Side-by-Side Patch Preview**: Visual diff panel comparing current field content with proposed modifications, complete with rationale explanations.
- **Selective Application**: Individual checkboxes for each patch, allowing authors to review, selectively apply (`Apply Selected`), or apply all proposed changes (`Apply All`) directly into the card editor with full undo support.
- **Assistant View**: Context-aware AI writing assistant that reads active card state and offers chat guidance or structured patch proposals upon request.
- **Enhancer View**: Diagnostic tool that evaluates roleplay transcript runs and diagnostic scores to propose structured character enhancements.

### 5. Crucible Testing Lab
- **Multi-Model Simulation Sandbox**: Test character card prompts directly against multiple LLM backends (Gemini, OpenAI, Anthropic, OpenRouter, Ollama).
- **Diagnostic Metrics**: Track agenda retention, character voice stability, boundary compliance, and response coherence during test runs.
- **Transcript Evaluation**: Save and review full conversation transcripts and performance scores across different connection profiles and scenarios.

### 6. Provider Connectivity & Cost Controls
- **Searchable OpenRouter Model Catalog**: When configuring OpenRouter profiles, an interactive combobox queries the public OpenRouter API to search models in real time, displaying inline per-1K prompt/completion token pricing and context window limits with an instant manual entry fallback.
- **Usage & Cost Tracking**: Live estimation of token expenditure and accumulated dollar costs calculated per connection profile based on real-time pricing data and token usage counters.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) or Bun

### Installation & Development
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit & integration test suite
npm run test

# Perform TypeScript check & ESLint audit
npm run lint
```

---

## ⚠️ Known Limitations

- **Platform Verification**: PWA installation and offline caching have been verified on Android (Chrome) and desktop Chromium browsers. iOS Safari PWA support is currently untested.
- **Android Themed Icons**: Material You dynamic icon recoloring (monochrome themed icons) is not supported by the Android OS for browser-installed web apps. The app displays its full-color branded icon correctly with standard maskable safe-zone padding, but will not dynamically adapt to system wallpaper palette shifts.
- **Solo/Small-Scale Project**: CardCrucible is an independent open-source project and has not undergone a formal third-party security audit. While cryptographic routines leverage standard WebCrypto primitives (AES-256-GCM, PBKDF2 with 600,000 iterations), users should treat local storage security accordingly.

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

