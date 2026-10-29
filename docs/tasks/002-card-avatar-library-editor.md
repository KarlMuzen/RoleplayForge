# Task 002: CardAvatar with fallback (Library and Details)

Status: in progress
Review: skip
Goal: A card cover that fails to load shows the initials tile instead of a broken image, in the Library grid and the Details editor.
Files to touch: `src/components/CardAvatar.tsx` (new), `src/components/gallery/GalleryCardsGrid.tsx`, `src/components/EditorView.tsx`, `test/CardAvatar.test.tsx` (new)
Do not touch: the other `<img>` sites (Task 003), store, db, image import/upload code, frozen identifiers.
Changes:
1. New component `CardAvatar`. Props: `src`, `name`, `className`, and whatever the two call sites need to keep today's look. It renders the `<img>` while `src` is set and has not failed. On the image `error` event it switches (component state) to the initials tile. The failed state resets when `src` changes.
2. The initials tile does not exist in the repo yet; this card defines it (the earlier wording was wrong). The tile fills the frame it is given: background `bg-void-900/50`, text `text-knight-500 font-semibold` centred, text size from a `fallbackClassName` prop (default `text-sm`). Text = first letter of the first two words of `name`, upper-cased (for example "Ada Lovelace" gives "AL", "Ada" gives "A"). If `name` is empty or has no letters or digits, show the `User` icon from lucide-react instead, same colour. The same tile shows when `src` is empty and when the image fails.
   - Keep each site's current `alt` and `referrerPolicy`. Keep the image classes each site has today.
   - Library site: `fallbackClassName="text-4xl"`.
   - Details site: `fallbackClassName="text-3xl"`. It keeps the "No Cover" caption under the tile only when `src` is empty (not after a load failure). Add an optional `emptyLabel` prop for this, shown only when `src` is empty.
3. Use it in `GalleryCardsGrid.tsx` (about line 112) and `EditorView.tsx` (about line 683), replacing the `<img>` and its no-avatar branch.
4. Test: shows the image; after an `error` event shows the initials; after `src` changes shows the image again; two-word name gives two letters; empty name gives the icon; `emptyLabel` shows only when `src` is empty.
Done when: CI green. Owner on the preview: open a card whose avatar address is dead (or go offline). The Library and Details show initials, with no broken-image icon and no alt text.
Decisions: 16.

## Progress (executor, update every commit)
Done: Added the shared `CardAvatar` component with source-specific error state, initials and User-icon fallback, and the site-specific empty label/sizing props. Replaced the Library and Details cover blocks and added component tests for the required fallback cases.
Left: Open PR, verify CI, and record the final result.
Next action: Open PR to main and check CI.

## Result (executor, when finished)
Pull request: 
Checks run by executor: 
CI: 
Preview link: 
Deviations from the card: 

## Review (Claude, if required)
n/a (Review: skip)
