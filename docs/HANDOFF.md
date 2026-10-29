# Handoff — 2026-10-29 (steps 0 and 1 done, Back-in-modals done, UI audit done)

Supersedes the "Next actions" in `UI_UX_REDESIGN_SPEC.md` §17. Read this first.

## Done on `main`

- **Step 0 `b98e25d` — security headers.** `vercel.json` serves CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (HSTS comes from Vercel). Theme bootstrap moved to `public/theme-init.js`. CSP `connect-src` allows localhost for Ollama. Guard test `test/securityHeaders.test.ts`. **securityheaders.com: D -> A+.**
- **Step 1 `bfdd6b2` — hash routing.** `src/routing/hashRoute.ts`, `src/routing/useHashRouting.ts` (mounted in `App.tsx`): `#/library`, `#/forge/<uuid>/<details|lorebook|prompt|assist>`, `#/test/<uuid>/<stress|enhancer>`, `#/settings`. Push on screen/card change, replace on sub-tab change. Unknown card or garbage hash -> Library. Reload and deep links restore card + tab (owner confirmed on phone). Flushes pending autosave before route-driven card switches. Scroll resets on screen change. Hash (not path) routes because the Vercel project has **zero routing rules**: `/studio/x` returns Vercel 404.
- **`2986e7e` — Back closes modals.** Owner reported Back did nothing in the Guide and navigated *behind* the passkey-setup modal. `useModalA11y` now gives every open modal one history entry; Back calls the modal's own close handler (so guards still apply: passkey setup refuses to close while a recovery key is showing, and Back is re-trapped). Only the top modal reacts; closing via X/Escape removes the entry. The Guide overlay in `App.tsx` now uses the hook (Back, Escape, focus trap). 6 unit tests. Verified in Chromium for the Guide. **Not testable in the sandbox:** the real passkey (WebAuthn) flow — owner should confirm on phone.

## UI audit (Chromium via `scripts/ui-audit.py`, 390x844, owner's Chub Helper v2 card imported: 9 KB description, 10 lorebook entries)

No screen overflows horizontally. Per screen (dark theme unless noted):

| Screen | targets <44px | text <12px (elements) | axe (non-minor) |
|---|---|---|---|
| Library + card | 6 | 2 | contrast 1, no h1 |
| Guide (dark / light) | 15 / 12 | 12 / 11 | contrast 1 / **14** |
| Details | **40** | 33 | contrast 13, select-name 3, scrollable-region-focusable 1 |
| Lorebook | 35 | 19 | contrast 4, label 1 |
| Prompt | 8 | 19 | contrast 11, scrollable-region-focusable 1 |
| Assist | 13 | 9 | button-name 2, contrast 4 |
| Test | 16 | 6 | contrast 7, select-name 1 |
| Enhancer | 6 | 5 | contrast 4 |
| Settings | 20 | 27 | button-name 1, select-name 1, contrast 4 |
| Library (light) | 3 | 1 | contrast **8** |

The **light theme has materially more contrast failures** than dark (Library 8 vs 1, Guide 14 vs 1).

Visual findings (screenshots reviewed: Library, Details, Lorebook, Guide light/dark):
1. **Guide close band.** `GuideView.tsx` line ~183: `sticky top-0 z-30 -mt-4 ... bg-void-950/95 backdrop-blur-xl py-2` wraps only the X button. At scroll top it is an empty ~110px grey band; when scrolled it covers the content (it clipped the title in the owner's screenshot). Fix: make the wrapper `sticky top-0 z-30 h-0 flex justify-end` with no background, and give the X button a shadow, so it floats without taking space.
2. **Details first screen has no writing fields** (Save/Export, token budget, cover art come first). With a real card the token header also wraps to two lines ("(4907 / 4096 OpenAI Tokens)").
3. **Broken cover image has no fallback**: when the remote avatar fails (offline PWA, blocked host — imported cards point at `avatars.charhub.io`), the browser's alt text and broken icon render inside the frame. Add an `onError` fallback to the initials tile. (The sandbox has no network, so it hit this; real users hit it offline.)
4. **Header is inconsistent across tabs:** the `Chat` button shows on Lorebook but not on Details.
5. Lorebook: delete icon sits next to copy icon at touch size; not tested whether delete confirms. Check.
6. `Service worker registration failed ... reading 'waiting'` appeared in the console when service workers were blocked (probably a test artifact). `usePWAUpdate` should tolerate an undefined registration; verify before changing.
7. Not yet reviewed visually: Prompt, Assist, Test, Enhancer, Settings screenshots, light theme beyond Library/Guide, desktop (the first desktop run crashed because a new browser context has an empty library; fixed in the committed script by importing the card in the desktop context).

## Next steps, in order (one commit each; verify `main` SHA first; `npm run lint && npm test && npm run build`)

Note for whoever edits: `push_files` needs full file contents, so edits to big files (`GuideView.tsx` 664 lines, `cardSlice.ts` ~700 lines) are expensive through the GitHub tool; prefer a clone + normal git push if available.

2. **Quick wins batch:** Guide close band (finding 1), cover-image `onError` fallback (3), `Chat` button consistency (4), label the 5 unlabelled `<select>`s and 3 unnamed buttons, 12px minimum text.
3. **Reorder Details** (spec UX-DET-1): name + completeness, then description/personality/scenario, greetings, lorebook summary, advanced prompts, metadata; cover/export collapsed into one section at the bottom; token budget as a compact chip.
4. **One sticky ContextBar** replacing `WorkspaceSubNav` and `LabSubNav`: sticky with safe-area top padding, tabs >=44px, Undo/Redo on all Forge tabs. Routes already exist, so tabs only call `setActiveTab`.
5. **Contrast pass, light theme first**, then tap targets to 44px via one shared class; then add axe + a mobile Playwright smoke test to CI (spec P2-7) based on `scripts/ui-audit.py`.
6. **D-13 on the Library tap path:** `selectCardForEditing` in `cardSlice.ts` still does not flush a pending autosave (the router does for Back/Forward/deep links). Move `flushPendingAutosave` from `useHashRouting.ts` into it, with a store test.

Defer: semantic token layer, tablet rail, import receipts, per-hunk patch selection, standalone lorebook shelf, Enhancer move.

## Owner phone checklist (still open)

1. Passkey setup: press Back while the modal is open (it should close, or stay open and not navigate if a recovery key is showing).
2. Guide: Back, Escape-equivalent (X) both close it; afterwards Back still steps through screens normally.
3. Android installed-PWA smoke test (standalone Back behaviour, keyboard over bottom nav, theme-color, update prompt, uninstall data retention).
4. Ollama connection test to `http://localhost:11434` (Chrome may prompt for local-network access on https; untested).

## Guardrails (unchanged)

Do not change DB name `CardCrucibleDB`, settings keys, `enc.v1.` format, passkey or sync identifiers. No origin or project rename. Verify `main` head before each direct commit. The owner's helper card is a test fixture only; it is not committed (ask before adding it to the repo).
