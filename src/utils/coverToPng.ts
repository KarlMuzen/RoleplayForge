import type { CharacterCardV3 } from '../schemas/cardSchema';
import { isPng, pickCoverBytes } from '../core/coverAsset';

type ImageConverter = (bytes: Uint8Array) => Promise<Uint8Array | null>;

const COVER_CONVERSION_NOTE =
  'The cover could not be converted to PNG, so the file was exported without a picture.';

/** Decodes an embedded image and encodes it as a PNG no larger than 2048px per side. */
export async function convertImageToPng(bytes: Uint8Array): Promise<Uint8Array | null> {
  let bitmap: ImageBitmap | undefined;

  try {
    bitmap = await createImageBitmap(new Blob([bytes as unknown as BlobPart]));
    if (bitmap.width <= 0 || bitmap.height <= 0) return null;

    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    let pngBlob: Blob;

    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext('2d');
      if (!context) return null;
      context.drawImage(bitmap, 0, 0, width, height);
      pngBlob = await canvas.convertToBlob({ type: 'image/png' });
    } else {
      if (typeof document === 'undefined') return null;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return null;
      context.drawImage(bitmap, 0, 0, width, height);
      pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Could not encode the cover as PNG.'));
        }, 'image/png');
      });
    }

    if (pngBlob.size === 0) return null;
    return new Uint8Array(await pngBlob.arrayBuffer());
  } catch {
    return null;
  } finally {
    try {
      bitmap?.close();
    } catch {
      // Cleanup errors must not interrupt an export.
    }
  }
}

/** Prepares the card's cover for a PNG export without allowing conversion failures to abort export. */
export async function prepareCoverForPng(
  card: CharacterCardV3,
  embeddedAssets?: Record<string, Uint8Array>,
  convert: ImageConverter = convertImageToPng
): Promise<{ basePng?: Uint8Array; note?: string }> {
  const cover = pickCoverBytes(card, embeddedAssets);
  if (!cover) return {};
  if (isPng(cover)) return { basePng: cover };

  try {
    const converted = await convert(cover);
    if (converted && converted.byteLength > 0) return { basePng: converted };
  } catch {
    // A failing converter must not prevent the card itself from being exported.
  }

  return { note: COVER_CONVERSION_NOTE };
}
