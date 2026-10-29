# Task 003: CardAvatar at the remaining sites

Status: done
Review: skip
Goal: Every other place that shows a card cover uses `CardAvatar`, so none can show a broken image.
Files to touch: `src/components/LabSubNav.tsx` (about line 44), `src/components/WorkspaceSubNav.tsx` (about line 72), `src/components/ChatPreviewModal.tsx` (about lines 230 and 456), `src/components/Navigation.tsx` (about line 200), `src/components/editor/ExportVerifyModal.tsx` (about line 117)
Do not touch: `CardAvatar.tsx` itself (change it only if a site truly cannot work, and say so in Result), store, db, frozen identifiers.
Changes:
1. Start only after Task 002 is merged to `main`.
2. Replace each card-cover `<img>` above with `CardAvatar`, keeping the site's size, shape, `alt` and `referrerPolicy`. Pass `fallbackClassName` with a text size that fits the box (about a third of its height; for example `text-xs` in a 32px circle).
3. Leave the logo images (`/forge-mark.svg`) alone.
4. If the image in `ExportVerifyModal.tsx` is a local image the app generated itself (data or blob address) and not a remote cover, leave it and say so in Result.
Done when: CI green. Owner on the preview: with a dead avatar address, the top bars, Test Chat and the side nav show initials, never a broken icon.
Decisions: 16.

## Progress (executor, update every commit)
Done: Replaced card-avatar images in LabSubNav, WorkspaceSubNav, both ChatPreviewModal character-avatar sites, and Navigation with the shared CardAvatar component while preserving each site's alt text, image classes, and existing referrerPolicy settings (none were set at these sites). Kept the generated poster preview in ExportVerifyModal unchanged because it is a local blob URL created from the app-rendered PNG bytes. PR #5 squash-merged after the final required CI check passed.
Left: None.
Next action: None; task complete.

## Result (executor, when finished)
Pull request: #5 — https://github.com/KarlMuzen/RoleplayForge/pull/5
Checks run by executor: Not run locally; `git clone` could not resolve `github.com`. GitHub CI is authoritative.
CI: Green — `test-and-lint` passed on final PR head `7d00ce9af595bb877f1c25276d76b639343e5292` (lint, tests, production build). Squash-merged as `b5101877449d76a264ea39b66034c97913e562da`.
Preview link: https://roleplayforge-git-wip-003-xiorolab.vercel.app
Deviations from the card: The generated poster preview in `ExportVerifyModal.tsx` was left unchanged because `EditorView.tsx` generates it from local PNG bytes and displays it using a blob URL. Auto-merge did not complete even after it was enabled; manually squash-merged PR #5 once all required checks were green.

## Review (Claude, if required)
n/a (Review: skip)
