import { describe, expect, it, vi } from 'vitest';
import extractChunks from 'png-chunks-extract';
import encodeChunks from 'png-chunks-encode';
import pngChunkText from 'png-chunk-text';
import { createDummyPng } from '../src/utils/encoding';
import { CharacterCardV3Schema, type CharacterCardV3 } from '../src/schemas/cardSchema';
import { exportCardData, importCardData } from '../src/io';
import { readCardFromPng } from '../src/io/png';
import { writeCardToCharx } from '../src/io/charx';
import { isPng, pickCoverBytes } from '../src/core/coverAsset';
import { prepareCoverForPng } from '../src/utils/coverToPng';

function makeCard(
  assets: NonNullable<CharacterCardV3['data']['assets']> = []
): CharacterCardV3 {
  return {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name: 'Cover Export Character',
      description: '',
      tags: [],
      creator: '',
      character_version: '',
      mes_example: '',
      extensions: {},
      system_prompt: '',
      post_history_instructions: '',
      first_mes: '',
      alternate_greetings: [],
      personality: '',
      scenario: '',
      creator_notes: '',
      group_only_greetings: [],
      assets,
    },
  };
}

function iconAsset(uri: string, name = 'main'): NonNullable<CharacterCardV3['data']['assets']>[number] {
  return { type: 'icon', uri, name, ext: 'png' };
}

function addTextChunk(png: Uint8Array, keyword: string): Uint8Array {
  const chunks = extractChunks(png);
  const ihdrIndex = chunks.findIndex((chunk) => chunk.name === 'IHDR');
  chunks.splice(ihdrIndex + 1, 0, pngChunkText.encode(keyword, 'marker'));
  return encodeChunks(chunks);
}

function hasTextChunk(png: Uint8Array, keyword: string): boolean {
  return extractChunks(png).some(
    (chunk) => chunk.name === 'tEXt' && pngChunkText.decode(chunk.data).keyword === keyword
  );
}

describe('PNG cover export helpers', () => {
  it('recognizes the PNG signature and rejects JPEG or empty bytes', () => {
    expect(isPng(createDummyPng())).toBe(true);
    expect(isPng(new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toBe(false);
    expect(isPng(new Uint8Array())).toBe(false);
  });

  it('picks the main icon bytes by asset URI', () => {
    const cover = createDummyPng();
    const card = makeCard([iconAsset('embeded://images/main.png')]);
    expect(pickCoverBytes(card, { 'embeded://images/main.png': cover })).toBe(cover);
  });

  it('falls back to the first embeded main-icon key when the asset URI is missing', () => {
    const cover = createDummyPng();
    const card = makeCard([iconAsset('embeded://images/missing.png')]);
    expect(pickCoverBytes(card, { 'embeded://icon/main.png': cover })).toBe(cover);
  });

  it('prefers the main icon over another icon', () => {
    const main = createDummyPng();
    const other = new Uint8Array([1, 2, 3]);
    const card = makeCard([
      iconAsset('embeded://images/other.png', 'thumbnail'),
      iconAsset('embeded://images/main.png', 'main'),
    ]);
    expect(
      pickCoverBytes(card, {
        'embeded://images/other.png': other,
        'embeded://images/main.png': main,
      })
    ).toBe(main);
  });

  it('returns null when there is no icon asset', () => {
    const card = makeCard([]);
    expect(pickCoverBytes(card, { 'embeded://anything.bin': new Uint8Array([1]) })).toBeNull();
  });

  it('returns null when the matched icon bytes are empty', () => {
    const card = makeCard([iconAsset('embeded://images/main.png')]);
    expect(pickCoverBytes(card, { 'embeded://images/main.png': new Uint8Array() })).toBeNull();
  });

  it('returns null for a ccdefault icon without a main-icon fallback', () => {
    const card = makeCard([iconAsset('ccdefault:')]);
    expect(pickCoverBytes(card, { 'embeded://other/cover.png': createDummyPng() })).toBeNull();
  });

  it('preserves the PNG cover image and the card metadata through export and import', async () => {
    const cover = addTextChunk(createDummyPng(), 'cover-marker');
    const card = makeCard([iconAsset('embeded://icon/main.png')]);
    const bytes = await exportCardData(card, 'png', {
      embeddedAssets: { 'embeded://icon/main.png': cover },
    });

    expect(hasTextChunk(bytes, 'cover-marker')).toBe(true);
    expect(readCardFromPng(bytes).card.data.name).toBe(card.data.name);
  });

  it('still exports and imports a card with no cover', async () => {
    const card = makeCard([]);
    const bytes = await exportCardData(card, 'png');
    expect(readCardFromPng(bytes).card.data.name).toBe(card.data.name);
  });

  it('does not throw for a JPEG cover and omits that cover from the PNG', async () => {
    const card = makeCard([iconAsset('embeded://icon/main.jpg')]);
    const bytes = await exportCardData(card, 'png', {
      embeddedAssets: { 'embeded://icon/main.jpg': new Uint8Array([0xff, 0xd8, 0xff, 0x00]) },
    });

    expect(hasTextChunk(bytes, 'cover-marker')).toBe(false);
    expect(readCardFromPng(bytes).card.data.name).toBe(card.data.name);
  });

  it('uses PNG bytes returned by the injected converter', async () => {
    const cover = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
    const converted = createDummyPng();
    const card = makeCard([iconAsset('embeded://icon/main.jpg')]);
    const convert = vi.fn(async () => converted);

    await expect(
      prepareCoverForPng(card, { 'embeded://icon/main.jpg': cover }, convert)
    ).resolves.toEqual({ basePng: converted });
    expect(convert).toHaveBeenCalledWith(cover);
  });

  it('returns the conversion warning when the converter cannot convert the cover', async () => {
    const cover = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
    const card = makeCard([iconAsset('embeded://icon/main.jpg')]);
    const result = await prepareCoverForPng(card, { 'embeded://icon/main.jpg': cover }, async () => null);

    expect(result.basePng).toBeUndefined();
    expect(result.note).toBe('The cover could not be converted to PNG, so the file was exported without a picture.');
  });

  it('does not call the converter for an existing PNG cover', async () => {
    const cover = createDummyPng();
    const card = makeCard([iconAsset('embeded://icon/main.png')]);
    const convert = vi.fn(async () => null);

    await expect(
      prepareCoverForPng(card, { 'embeded://icon/main.png': cover }, convert)
    ).resolves.toEqual({ basePng: cover });
    expect(convert).not.toHaveBeenCalled();
  });

  it('returns an empty result when there is no cover', async () => {
    const convert = vi.fn(async () => null);
    await expect(prepareCoverForPng(makeCard([]), {}, convert)).resolves.toEqual({});
    expect(convert).not.toHaveBeenCalled();
  });

  it('uses an explicitly supplied base PNG before the card cover', async () => {
    const cover = addTextChunk(createDummyPng(), 'cover-marker');
    const explicitBase = addTextChunk(createDummyPng(), 'explicit-base-marker');
    const card = makeCard([iconAsset('embeded://icon/main.png')]);
    const bytes = await exportCardData(card, 'png', {
      basePng: explicitBase,
      embeddedAssets: { 'embeded://icon/main.png': cover },
    });

    expect(hasTextChunk(bytes, 'explicit-base-marker')).toBe(true);
    expect(hasTextChunk(bytes, 'cover-marker')).toBe(false);
  });

  it('keeps JSON and CHARX export bytes unchanged when the card has a cover', async () => {
    const card = makeCard([iconAsset('embeded://icon/main.png')]);
    const embeddedAssets = { 'embeded://icon/main.png': createDummyPng() };
    const validatedCard = CharacterCardV3Schema.parse(card);
    const jsonBytes = await exportCardData(card, 'json', { embeddedAssets });
    expect(jsonBytes).toEqual(
      new TextEncoder().encode(JSON.stringify(validatedCard, null, 2))
    );

    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-30T12:00:00.000Z'));
    try {
      const expectedCharx = await writeCardToCharx(validatedCard, embeddedAssets);
      const actualCharx = await exportCardData(card, 'charx', { embeddedAssets });
      expect(actualCharx).toEqual(expectedCharx);
    } finally {
      vi.useRealTimers();
    }
  });
});
