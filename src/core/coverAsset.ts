import type { CharacterCardV3 } from '../schemas/cardSchema';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Returns true when the bytes begin with the eight-byte PNG signature. */
export function isPng(bytes: Uint8Array): boolean {
  return bytes.length >= PNG_SIGNATURE.length &&
    PNG_SIGNATURE.every((value, index) => bytes[index] === value);
}

/** Picks only the card's main icon (or first icon) from its embedded assets. */
export function pickCoverBytes(
  card: CharacterCardV3,
  embeddedAssets?: Record<string, Uint8Array>
): Uint8Array | null {
  const iconAsset =
    card.data.assets?.find((asset) => asset.type === 'icon' && asset.name === 'main') ??
    card.data.assets?.find((asset) => asset.type === 'icon');

  if (!iconAsset || !embeddedAssets) return null;

  const bytes =
    embeddedAssets[iconAsset.uri] ??
    Object.entries(embeddedAssets).find(([uri]) => uri.startsWith('embeded://icon/main.'))?.[1];

  return bytes && bytes.byteLength > 0 ? bytes : null;
}
