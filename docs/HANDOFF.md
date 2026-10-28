# Handoff — 2026-10-29 (steps 0 and 1 done)

Supersedes the "Next actions" in `UI_UX_REDESIGN_SPEC.md` §17. Read this first.

## Verified findings (production build of `17841bb`, Chromium/Playwright at 360/390/1280px; live deploy confirmed to be the same commit)

- **Back button left the app** and reload always returned to an empty Library. **Fixed in step 1.**
- **Sub-nav is not sticky.** Scrolled 1500px it sat at -1435px. Scroll position also carried across tab switches (scroll reset added in step 1; sub-nav is still not sticky — step 3). The spec's "sticky sub-nav" claim was wrong.
- **Details screen order:** first screen is Save/Export, token budget and cover art; writing fields start ~1.5 screens down. Page is 3,091px tall on a 390x844 phone. Settings is 3,537px. (step 2)
- **Touch targets under 44px:** sub-nav tabs 29px, Help 36px, Save Card 32px; 32 undersized targets on Details. Text at 9-11px on every Forge/Test/Settings screen. (step 4)
- **axe-core:** 3 unlabelled `<select>` on Details, 1 on Settings (critical); 1 unnamed button on Settings (critical); 11 color-contrast failures on Details, 4 on Settings. Light-theme axe results were identical to dark; not confirmed the light theme was applied — treat light theme as unchecked. (step 4)
- **Hosting:** Vercel project is `roleplayforge` (team `xiorolab`, Hobby), not `rpforge`. It has **zero routing rules**: a direct visit to `/studio/test` returns Vercel 404 (confirmed on a phone). **Path routes are not viable; the app uses hash routes.** Do not add a catch-all rewrite unless there is a reason.
- **Theme storage:** the real theme lives in IndexedDB (`app_theme`); localStorage `roleplay-forge-theme` is a mirror read by `public/theme-init.js`. Keep both in sync.

## Done

### Step 0 — security headers (`b98e25d`)
`vercel.json` serves CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (HSTS comes from Vercel). Inline theme script moved to `public/theme-init.js`. CSP `connect-src` allows `http://localhost:*` / `http://127.0.0.1:*` for Ollama. `test/securityHeaders.test.ts` guards parity with `public/_headers`. **Live result: securityheaders.com grade D -> A+ (all six headers present).**

### Step 1 — hash routing
- `src/routing/hashRoute.ts`: `#/library`, `#/forge[/<uuid>[/details|lorebook|prompt|assist]]`, `#/test[/<uuid>[/stress|enhancer]]`, `#/settings`. Unknown routes parse to `null`.
- `src/routing/useHashRouting.ts`, mounted in `App.tsx`: store is still the source of truth. Store -> URL: **push** when the screen or card changes, **replace** when only a sub-tab inside the same section changes. URL -> store on `popstate` and on load. Unknown card id or garbage hash -> Library (toast, no extra history entry). Empty hash normalised to `#/library`.
- Before a route-driven card switch the hook flushes a pending autosave (D-13), covered by a test.
- `App.tsx` scrolls to top when the screen changes.
- Tests: `test/hashRoute.test.ts`, `test/hashRouting.test.tsx` (11 tests). Browser e2e (390x844, new CSP) confirmed: Back/Forward step through screens, reload and deep link restore card + tab, unknown card and garbage hash go to Library, scroll resets, no CSP console errors.
- Behaviour to know: Back from Library root leaves the app (platform default). Sub-tab changes in Forge/Test are replaced, so Back goes to the previous *screen*, not the previous sub-tab.

## Known gaps / follow-ups

1. **D-13 on the Library tap path:** `selectCardForEditing` in `src/store/slices/cardSlice.ts` still does not flush a pending autosave. The router flushes for Back/Forward/deep links only. Move `flushPendingAutosave` (in `useHashRouting.ts`) into `selectCardForEditing` and add a store test. It was kept out of step 1 only to keep the commit small.
2. Hash routing is not yet exercised on a real phone/PWA (see checklist).
3. Android installed-PWA smoke test not done (back button in standalone mode, keyboard over bottom nav, theme-color, update prompt, uninstall data retention).

## Phone checklist for the owner

1. Open the app, create/open a card, switch Forge tabs, then press system Back: you should step back through screens, not leave the app until Library.
2. Reload on a card URL: the same card and tab reopen.
3. Light theme saved + reload: no dark flash. Use the app for a minute under the new CSP; report anything broken.
4. Ollama connection test to `http://localhost:11434` (Chrome may prompt for local-network access on https; untested).

## Next steps, in order (one commit each; verify `main` SHA first; run `npm run lint && npm test && npm run build`)

2. **Reorder Details** (spec UX-DET-1): name + completeness, then description/personality/scenario, greetings, lorebook summary, advanced prompts, metadata, then cover/export in one collapsed section. Token budget becomes a compact chip.
3. **One sticky ContextBar** replacing `WorkspaceSubNav` and `LabSubNav`: sticky with safe-area top padding, tabs >=44px, Undo/Redo on all Forge tabs. Routes already exist, so tabs can become real links/buttons that only call `setActiveTab`.
4. **Accessibility pass:** label the 4 `<select>`s, name the unnamed button, 12px minimum text, 44px targets, fix contrast failures; then add axe + a mobile Playwright smoke test to CI (spec P2-7). The e2e flow used for step 1 is a good template.

Defer: semantic token layer, tablet rail, import receipts, per-hunk patch selection, standalone lorebook shelf, Enhancer move.

## Guardrails (unchanged)

Do not change DB name `CardCrucibleDB`, settings keys, `enc.v1.` format, passkey or sync identifiers. No origin or project rename. Verify `main` head before each direct commit.
