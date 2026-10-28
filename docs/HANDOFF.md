# Handoff — 2026-10-29 (frontend review, step 0 done)

Supersedes the "Next actions" in `UI_UX_REDESIGN_SPEC.md` §17. Read this first.

## What was verified (production build of `17841bb`, Chromium via Playwright at 360/390/1280px; live deploy confirmed to be the same commit)

- **Back button leaves the app** (history goes to `about:blank`). Reload always returns to an empty Library and loses the active card.
- **Sub-nav is not sticky.** Scrolled 1500px it sits at -1435px. Scroll position also carries across tab switches (Test opens mid-page). The spec's "sticky sub-nav" claim is wrong.
- **Details screen order:** first screen is Save/Export, token budget and cover art; writing fields start ~1.5 screens down. Page is 3,091px tall on a 390x844 phone. Settings is 3,537px.
- **Touch targets under 44px:** sub-nav tabs 29px, Help 36px, Save Card 32px; 32 undersized targets on Details. Text at 9-11px on every Forge/Test/Settings screen.
- **axe-core:** 3 unlabelled `<select>` on Details, 1 on Settings (critical); 1 unnamed button on Settings (critical); 11 color-contrast failures on Details, 4 on Settings. Light-theme axe results were identical to dark; not confirmed the light theme was applied. Treat light theme as unchecked.
- **Hosting facts:** Vercel project is `roleplayforge` (team `xiorolab`, Hobby), not `rpforge`. It has **zero routing rules**: a direct visit to `/studio/test` returns Vercel 404. **Path routes are therefore not viable; use hash routes** (`#/studio/<id>/details`). Do not add a catch-all rewrite unless there is a reason.
- **Headers:** securityheaders.com graded the live site **D** (only HSTS, which Vercel adds itself). `public/_headers` is a Cloudflare/Netlify convention and is ignored by Vercel.
- **CSP tests (local, 4 variants):** under the old CSP the inline theme script is refused (light-theme users get a dark first paint) and `http://localhost:11434` (Ollama) is blocked. Both fixed by this commit. CHARX export still produces a valid zip under the CSP. jszip triggers a harmless `script-src | eval` violation on load.
- **Theme storage:** the app's real theme lives in IndexedDB (`app_theme`); localStorage `roleplay-forge-theme` is a mirror used by `public/theme-init.js`. Keep both in sync.

## Done in this commit (step 0)

- `vercel.json`: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. HSTS intentionally not set (Vercel adds `max-age=63072000`; avoids committing to `preload`).
- Inline theme script moved to `public/theme-init.js`; `index.html` references it.
- CSP `connect-src` now allows `http://localhost:*` and `http://127.0.0.1:*`.
- `public/_headers` kept in sync; `test/securityHeaders.test.ts` guards CSP parity, no inline scripts, localhost allowance.

## Verify after deploy (needs a human on a phone)

1. Re-run `https://securityheaders.com/?q=roleplayforge.vercel.app&followRedirects=on`; expect all five headers present.
2. Open the app with a **light** theme saved: no dark flash on reload.
3. With Ollama running on the phone/desktop, test a connection profile to `http://localhost:11434`. On https, Chrome may show a local-network permission prompt (untested).
4. Check the browser console for CSP violations on cold load (Google Fonts were not testable in the sandbox).

## Next steps, in order (one commit each, verify `main` SHA first, run `npm run lint && npm test && npm run build`)

1. **Hash routing.** Small in-repo module: parse/serialize/subscribe/navigate. Route table in spec §4.5, hash form. `activeTab` derived from route. Tab changes inside Forge use `replaceState`; opening a card from Library pushes. Flush the pending autosave before any card switch (spec D-13). Unknown card id -> empty state with "Back to Library". Tests: parse/serialize round trip, back/forward, unknown id.
2. **Reorder Details** (spec UX-DET-1): name + completeness, then description/personality/scenario, greetings, lorebook summary, advanced prompts, metadata, then cover/export in one collapsed section. Token budget becomes a compact chip.
3. **One sticky ContextBar** replacing `WorkspaceSubNav` and `LabSubNav`: sticky with safe-area top padding, tabs >=44px, scroll to top on tab change, Undo/Redo on all Forge tabs.
4. **Accessibility pass:** label the 4 `<select>`s, name the unnamed button, 12px minimum text, 44px targets, fix contrast failures; then add axe + a mobile Playwright smoke test to CI (spec P2-7).

Defer: semantic token layer, tablet rail, import receipts, per-hunk patch selection, standalone lorebook shelf, Enhancer move.

## Guardrails (unchanged)

Do not change DB name `CardCrucibleDB`, settings keys, `enc.v1.` format, passkey or sync identifiers. No origin or project rename. Verify `main` head before each direct commit.

## Not yet done anywhere

Android installed-PWA smoke test (back button, keyboard over bottom nav, theme-color, update prompt, uninstall data retention).
