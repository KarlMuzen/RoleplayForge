# Task 029: Standard PNG export keeps the card's cover picture

Status: in progress
Review: required
Goal: Exporting a card as PNG (Editor export, Library "Export all" ZIP, Library "Export selected" ZIP) writes the card's real cover picture into the file, not a 1x1 blank image. A cover that is JPEG or WebP is converted to PNG first. If a cover cannot be used, the export still works and the app says so.
Files to touch: new `src/core/coverAsset.ts` (pure); new `src/utils/coverToPng.ts` (browser image conversion); `src/io/index.ts` (the `format === 'png'` branch of `exportCardData` only); `src/components/EditorView.tsx` (the PNG export call only); `src/components/GalleryView.tsx` (the PNG case of `handleBulkExportAllZip` and `handleBulkExportSelectedZip` only); new `test/coverExport.test.ts`.
Do not touch: `src/io/png.ts`, the CHARX and JSON export branches, `visualCardExporter.ts` and the visual PNG path, import code, the store, schemas, frozen identifiers. No new npm package.
Evidence (Claude, 2026-10-30, read of `main` `365a9ac`; first reported by an outside review, then checked): `exportCardData` (`src/io/index.ts`, `format === 'png'`) calls `writeCardToPng(validatedCard, { basePng: options.basePng, backfillV2: options.backfillV2 })`. It never reads `options.embeddedAssets`, although `EditorView.tsx` (line 270) and `GalleryView.tsx` (lines 415 and 446) pass it. No caller sets `basePng` (only `visualCardExporter.ts` does). `writeCardToPng` (`src/io/png.ts`) then uses `createDummyPng()` (1x1). So every standard PNG export loses the cover. `writeCardToPng` already removes existing `ccv3` and `chara` text chunks from the base image, so using the cover PNG as the base is safe. The app picks a cover with `getCardCoverUrl` (`src/components/gallery/galleryUtils.ts`): the `icon` asset named `main`, else any `icon` asset, bytes taken from `embeddedAssets[uri]`, else from `embeded://icon/main.*`. Import stores the cover as `embeded://icon/main.<ext>`.
Correction (Claude, 2026-10-30, `main` `a53dea9`, after the executor stopped on the first version of this card): the Library has no standalone single-card PNG export. `GalleryView.tsx` line 415 is inside `handleBulkExportAllZip` and line 446 is inside `handleBulkExportSelectedZip`; both build a ZIP, and `exportCardData` has no other caller (Editor, these two handlers, `visualCardExporter.ts`). "Export selected" with one card ticked is the only single-card route in the Library, and it is a ZIP. The first version said "Library single export" in error. Each handler takes a `format` argument (`png`, `json`, `charx`); the cover work applies only when `format === 'png'`.
Design (the whole spec; do not improvise):
1. `src/core/coverAsset.ts` (no React, no DOM) exports:
   - `isPng(bytes: Uint8Array): boolean`: true when the first 8 bytes are `89 50 4E 47 0D 0A 1A 0A`.
   - `pickCoverBytes(card: CharacterCardV3, embeddedAssets?: Record<string, Uint8Array>): Uint8Array | null`: find the `icon` asset named `main`, else the first `icon` asset (`card.data.assets`); take `embeddedAssets[asset.uri]`; if missing, take the first key of `embeddedAssets` that starts with `embeded://icon/main.`; return it only when it has at least one byte; otherwise `null`. Do not use other assets, and do not copy the "any embedded asset" fallback of `getCardCoverUrl`.
2. In `exportCardData`, in the `png` branch: `basePng = options.basePng ?? (cover && isPng(cover) ? cover : undefined)` where `cover = pickCoverBytes(validatedCard, options.embeddedAssets)`. Pass that to `writeCardToPng`. Nothing else in the function changes. A JPEG or WebP cover reaching this point still gives the blank image (no throw); step 3 handles conversion before the call.
3. `src/utils/coverToPng.ts` (browser APIs allowed) exports:
   - `convertImageToPng(bytes: Uint8Array): Promise<Uint8Array | null>`: decode with `createImageBitmap(new Blob([bytes]))`, draw on an `OffscreenCanvas` (or a `document.createElement('canvas')` when `OffscreenCanvas` is missing), scale down so the longest side is at most 2048 px (never scale up), encode as PNG, return the bytes. Return `null` on any failure; never throw.
   - `prepareCoverForPng(card, embeddedAssets, convert = convertImageToPng): Promise<{ basePng?: Uint8Array; note?: string }>`: `cover = pickCoverBytes(...)`. No cover: `{}`. PNG: `{ basePng: cover }`. Otherwise: `converted = await convert(cover)`; if bytes, `{ basePng: converted }`; if `null`, `{ note: 'The cover could not be converted to PNG, so the file was exported without a picture.' }`.
4. Callers: `EditorView` (PNG export, not `visual_png`) calls `prepareCoverForPng(card, embeddedAssets)` before `exportCardData` and passes `basePng` in the options; a returned `note` is shown at once. `GalleryView`: in `handleBulkExportAllZip` and `handleBulkExportSelectedZip`, when `format === 'png'`, call `prepareCoverForPng(cardRecord.cardData, cardRecord.embeddedAssets)` for each card before `exportCardData` and pass `basePng`; for `json` and `charx` change nothing. Show a returned `note` with the toast helper the app already uses for warnings (read how `BackupRestoreSection` or `GalleryView` call it). In the two ZIP handlers collect the notes and show one toast at the end: "N cards were exported without a picture (cover could not be converted)." The export never stops because of a cover.
5. JSON and CHARX exports, the visual PNG export, and every import stay as they are.
Tests (`test/coverExport.test.ts`, vitest; the pure parts need no DOM; one test per line):
   - `isPng` is true for `createDummyPng()` output and false for bytes starting `FF D8 FF` and for an empty array.
   - `pickCoverBytes`: finds the `main` icon by `uri`; falls back to `embeded://icon/main.png` when the asset `uri` has no entry; prefers the `main` icon over another icon; returns `null` with no assets, with an empty byte array, and for a card whose only icon `uri` is `ccdefault:` and has no `main.*` key.
   - Base image used: build a base PNG from `createDummyPng()` plus one extra `tEXt` chunk with keyword `cover-marker` (use the chunk helpers in `src/io/png.ts`; read them first). `exportCardData(card, 'png', { embeddedAssets })` with that PNG as `embeded://icon/main.png` gives output that still contains the `cover-marker` chunk, and `readCardFromPng` (or `importCardData`) on the output returns the same card name.
   - Same call with no cover assets still exports and imports back (blank base), as before.
   - A JPEG cover (`FF D8 FF ...`) does not throw in `exportCardData`, and the output has no `cover-marker`.
   - `prepareCoverForPng` with an injected converter returning PNG bytes gives `{ basePng }` with those bytes; with a converter returning `null` gives a `note` and no `basePng`; with a PNG cover it never calls the converter; with no cover it returns `{}`.
   - Explicit `options.basePng` still wins over the card cover.
   - `json` and `charx` outputs are byte-for-byte the same as before for a card with a cover (compare with a call made before your change, or assert the existing round-trip tests stay green unchanged).
Not in this card: changing "Verify Export", PNG output size limits, the cover generator or its privacy notice, choosing between several covers, writing the cover into CHARX differently, the duplicate-chunk question in `png.ts`, adding a standalone single-card PNG export to the Library.
Done when: CI green; Claude's review is Approved (one diff read; check that `src/io/png.ts` is untouched, that no caller can fail an export because of the cover, and that the JSON and CHARX branches are unchanged). Owner, phone: Library, Export all as PNG ZIP; open one PNG from the ZIP; it shows the card's picture, not a blank square; import that PNG back; the card keeps its cover and text. Also tick one card, Export selected as PNG ZIP, and check the same. Also export one card with a JPEG cover from the Editor and check the same.
Decisions: 1 (no silent data loss), 2 (pure logic in `src/core/`).

## Progress (executor, update every commit)
Done: Confirmed main at c62c265; reread PROJECT_STATE.md, docs/AI_WORKFLOW.md and the corrected Task 029; checked open PRs and verified the scoped export call sites.
Left: Implement cover selection/conversion, wire the three PNG export paths, add the specified tests, open one PR and wait for green test-and-lint.
Next action: Add the pure cover helper and browser PNG conversion helper, then wire the export paths.

## Result (executor, when finished)
Pull request: 
Checks run by executor: 
CI: 
Deviations from the card: 

## Review (Claude, required)
