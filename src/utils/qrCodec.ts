import QRCode from 'qrcode';
import jsQR from 'jsqr';

/**
 * Generates a PNG data URL of a QR code representing the text.
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 4,
  });
}

/**
 * Starts continuous scanning of a video element for QR codes.
 * Returns a cleanup function to stop scanning.
 * Uses native BarcodeDetector if available, falling back to jsQR frame sampling.
 */
export function startQrScanner(
  videoEl: HTMLVideoElement,
  onResult: (text: string) => void
): () => void {
  let stopped = false;
  let requestFrameId: number;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let detector: any = null;

  // Feature detect native BarcodeDetector
  if ('BarcodeDetector' in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
    } catch (_e) {
      // Fallback to jsQR
    }
  }

  const scan = async () => {
    if (stopped) return;

    if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
      try {
        if (detector) {
          const barcodes = await detector.detect(videoEl);
          if (barcodes.length > 0) {
            onResult(barcodes[0].rawValue);
            stopped = true;
            return;
          }
        } else {
          // jsQR fallback
          // Downscale for performance
          const MAX_DIM = 400;
          const ratio = Math.min(MAX_DIM / videoEl.videoWidth, MAX_DIM / videoEl.videoHeight, 1);
          const drawW = videoEl.videoWidth * ratio;
          const drawH = videoEl.videoHeight * ratio;

          if (canvas.width !== drawW || canvas.height !== drawH) {
            canvas.width = drawW;
            canvas.height = drawH;
          }

          if (ctx) {
            ctx.drawImage(videoEl, 0, 0, drawW, drawH);
            const imageData = ctx.getImageData(0, 0, drawW, drawH);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (code) {
              onResult(code.data);
              stopped = true;
              return;
            }
          }
        }
      } catch (_e) {
        // Ignore frame errors, try next
      }
    }

    if (!stopped) {
      // Sample roughly every 150ms to save CPU
      setTimeout(() => {
        if (!stopped) {
          requestFrameId = requestAnimationFrame(scan);
        }
      }, 150);
    }
  };

  // Start loop
  requestFrameId = requestAnimationFrame(scan);

  return () => {
    stopped = true;
    if (requestFrameId) {
      cancelAnimationFrame(requestFrameId);
    }
  };
}
