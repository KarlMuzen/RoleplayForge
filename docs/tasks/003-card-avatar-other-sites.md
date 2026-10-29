# Task 003: CardAvatar at the remaining sites

Status: planned
Review: skip
Goal: Every other place that shows a card cover uses `CardAvatar`, so none can show a broken image.
Files to touch: `src/components/LabSubNav.tsx` (about line 44), `src/components/WorkspaceSubNav.tsx` (about line 72), `src/components/ChatPreviewModal.tsx` (about lines 230 and 456), `src/components/Navigation.tsx` (about line 200), `src/components/editor/ExportVerifyModal.tsx` (about line 117)
Do not touch: `CardAvatar.tsx` itself (change it only if a site truly cannot work, and say so in Result), store, db, frozen identifiers.
Changes:
1. Start only after Task 002 is merged to `main`.
2. Replace each card-cover `<img>` above with `CardAvatar`, keeping the site's size, shape, `alt` and `referrerPolicy`.
3. Leave the logo images (`/forge-mark.svg`) alone.
4. If the image in `ExportVerifyModal.tsx` is a local image the app generated itself (data or blob address) and not a remote cover, leave it and say so in Result.
Done when: CI green. Owner on the preview: with a dead avatar address, the top bars, Test Chat and the side nav show initials, never a broken icon.
Decisions: 16.

## Progress (executor, update every commit)
Done: 
Left: 
Next action: 

## Result (executor, when finished)
Pull request: 
Checks run by executor: 
CI: 
Preview link: 
Deviations from the card: 

## Review (Claude, if required)
n/a (Review: skip)
