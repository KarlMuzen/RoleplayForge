# Task 007: Rating filter shift, Assist layout, Chat header overflow

Status: planned
Review: skip
Goal: (a) Switching the Library rating filter no longer shifts or resizes the pill. (b) On a phone, the Assist message box sits fully above the bottom nav and the panel title is readable. (c) On a phone, the Chat header shows the character name and the avatar no longer overlaps the User-name box.
Files to touch: `src/components/gallery/GalleryFilterBar.tsx`, `src/components/AssistantView.tsx`, `src/components/ChatPreviewModal.tsx`
Do not touch: any other component, `App.tsx`, `Navigation.tsx`, `CardAvatar.tsx`, store, db, frozen identifiers. Do not rename icon-only buttons here (Task 006, already merged).
Changes:

Part A, rating filter (`GalleryFilterBar.tsx`, about lines 53-60 and 95-110)
Cause (from owner screenshots): the selected SFW, NSFW and Unrated options have a 1px border; All Ratings and every unselected option have none. So the pill gets about 2px wider and taller whenever one of those three is selected.
1. Add `border` to `targetClass`, so every option always has a 1px border.
2. In the `ratingOptions` list, remove the word `border` from the three coloured `selectedClass` strings; keep their `border-emerald-800/80`, `border-rose-800/80`, `border-amber-800/80` colours. Add `border-transparent` to the `all` option's `selectedClass`.
3. In the unselected branch (`text-knight-400 hover:text-mist-200`) add `border-transparent`.
4. Same colours, same look. The only change is that nothing moves when the selection changes.

Part B, Assist layout (`AssistantView.tsx`)
Cause: the root `div` (about line 346) is `h-[calc(100vh-65px)]`, but on a phone the top bar and the Details/Lorebook/Prompt/Assist tab strip sit above it and use about 150px, not 65px. The view is taller than the space left, so its bottom part, with the message box, sits under the fixed bottom nav. The `pb-24` already inside the root is meant to clear the nav; it only works if the root height is right.
5. On phones (under 768px wide) the root height must be: window inner height minus the root's distance from the top of the page (`getBoundingClientRect().top + window.scrollY`), with a floor of 320px. Implement with a `ref` on the root and a `useLayoutEffect` that sets `style.height` in pixels. Recompute on `resize` and `orientationchange`. Remove the listeners on cleanup. At 768px and wider, clear the inline height and keep today's `md:h-[calc(100vh-65px)]` (change the existing `h-[calc(100vh-65px)]` class to `md:h-[calc(100vh-65px)]`). `window.matchMedia` may be missing in tests: guard it so nothing throws.
6. Add `-mb-28 md:mb-0` to the root classes. `main` in `App.tsx` adds `pb-28` on phones; the root's own `pb-24` already clears the nav, so the extra padding would only create a pointless scroll.
7. Header row (about lines 351-370 and 391-398): give the title `h2` ("Assistant") `shrink-0`, so it is not cut to "Assis...". Give the text span inside the Inspector button (the one that shows the card name in capitals) `max-w-[7rem] truncate` so a long card name shrinks instead of the title.
8. Message input (about lines 527-533): change the placeholder to `Ask for advice or edits...` and add `aria-label="Message the assistant"`. Nothing else on it changes.

Part C, Chat header (`ChatPreviewModal.tsx`, header block about lines 218-270)
Cause (owner screenshot, 393px-wide phone): the right side of the header is about 314px wide (the User-name box is about 124px, plus four 44px buttons). That leaves about 55px for the left side (back arrow, avatar, title). The title shrinks to nothing and the avatar slides over the User-name box.
9. In the header, give the User-name box (the `div` with the `User:` label and the input, about line 258) `hidden sm:flex`. Add `data-testid="chat-user-name-header"` and `aria-label="Your name in the chat"` on its input.
10. Directly below the header `div` (same nesting level, before the messages area) add a phone-only row: `sm:hidden flex items-center gap-2 px-3 py-1.5 border-b border-knight-700/40 bg-void-950/90 shrink-0`. It holds the same kind of box (`User:` label and an input) bound to the same `userName` state and `setUserName`, with the same placeholder, `aria-label="Your name in the chat"` and `data-testid="chat-user-name-phone"`. Same text sizes as the header box; the input may grow (`flex-1`).
11. The avatar, back button and title stay in the header. Nothing else in the header changes. No existing test references `ChatPreviewModal` or the `User` placeholder; if CI shows one that does, update it to use the test ids above.

Task 006 is already merged. Start from the latest `main`.
Done when: CI green (existing tests still pass). Owner on the preview, phone: (a) in the Library, tapping All Ratings, SFW, NSFW and Unrated moves nothing and the pill keeps one width; (b) on the Assist tab the whole message box, with the wand and send buttons, is visible above the bottom nav, the title reads "Assistant", and the input hint is not cut off; (c) in Chat, the header shows the character name (cut with "..." if long), the avatar sits clear of the buttons, and the User-name box is on its own row under the header and still editable.
Decisions: 6, 8.

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
