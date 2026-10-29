# Task 002: CardAvatar with fallback (Library and Details)

Status: planned
Review: skip
Goal: A card cover that fails to load shows the initials tile instead of a broken image, in the Library grid and the Details editor.
Files to touch: `src/components/CardAvatar.tsx` (new), `src/components/gallery/GalleryCardsGrid.tsx`, `src/components/EditorView.tsx`, `test/CardAvatar.test.tsx` (new)
Do not touch: the other `<img>` sites (Task 003), store, db, image import/upload code, frozen identifiers.
Changes:
1. New component `CardAvatar`. Props: `src`, `name`, `className`, and whatever the two call sites need to keep today's look. It renders the `<img>` while `src` is set and has not failed. On the image `error` event it switches (component state) to the initials tile. The failed state resets when `src` changes.
2. Reuse the initials/no-avatar markup the two call sites already have. Do not invent a new look. Keep each site's current `alt` and `referrerPolicy`.
3. Use it in `GalleryCardsGrid.tsx` (about line 112) and `EditorView.tsx` (about line 683), replacing the `<img>` and its no-avatar branch.
4. Test: shows the image; after an `error` event shows the initials; after `src` changes shows the image again.
Done when: CI green. Owner on the preview: open a card whose avatar address is dead (or go offline). The Library and Details show initials, with no broken-image icon and no alt text.
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
