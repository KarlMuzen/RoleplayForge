// @vitest-environment jsdom
import '../test/setup';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { generateQrDataUrl, startQrScanner } from '../src/utils/qrCodec';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

vi.mock('jsqr', () => ({
  default: vi.fn(),
}));

describe('qrCodec', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateQrDataUrl', () => {
    it('generates a QR code data URL with medium error correction level', async () => {
      const mockDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';
      vi.mocked(QRCode.toDataURL).mockResolvedValueOnce(mockDataUrl as unknown as never);

      const result = await generateQrDataUrl('test-payload');

      expect(result).toBe(mockDataUrl);
      expect(QRCode.toDataURL).toHaveBeenCalledWith('test-payload', {
        errorCorrectionLevel: 'M',
        margin: 2,
        scale: 4,
      });
    });

    it('rejects with an error when payload exceeds QR capacity', async () => {
      const oversizedError = new Error('Amount of data is too big to be stored in a QR Code');
      vi.mocked(QRCode.toDataURL).mockRejectedValueOnce(oversizedError);

      await expect(generateQrDataUrl('huge-unsupported-sdp-payload')).rejects.toThrow(
        'Amount of data is too big to be stored in a QR Code'
      );
    });
  });

  describe('startQrScanner', () => {
    let mockVideo: HTMLVideoElement;

    beforeEach(() => {
      mockVideo = {
        readyState: 4, // HAVE_ENOUGH_DATA
        videoWidth: 640,
        videoHeight: 480,
        HAVE_ENOUGH_DATA: 4,
      } as unknown as HTMLVideoElement;

      // Mock canvas getContext
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        drawImage: vi.fn(),
        getImageData: vi.fn().mockReturnValue({
          data: new Uint8ClampedArray(400 * 300 * 4),
          width: 400,
          height: 300,
        }),
      } as unknown as CanvasRenderingContext2D);
    });

    afterEach(() => {
      delete (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector;
      vi.restoreAllMocks();
    });

    it('uses native BarcodeDetector if available and reports detected code', async () => {
      const mockDetect = vi.fn().mockResolvedValue([
        { rawValue: 'native-barcode-result' },
      ]);

      (window as unknown as { BarcodeDetector: unknown }).BarcodeDetector = class {
        detect = mockDetect;
      };

      const onResult = vi.fn();
      const stop = startQrScanner(mockVideo, onResult);

      // Allow requestAnimationFrame / async detect loop to execute
      await vi.waitFor(() => {
        expect(onResult).toHaveBeenCalledWith('native-barcode-result');
      });

      expect(mockDetect).toHaveBeenCalledWith(mockVideo);
      stop();
    });

    it('falls back to jsQR when BarcodeDetector is unavailable', async () => {
      delete (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector;

      vi.mocked(jsQR).mockReturnValue({
        data: 'jsqr-decoded-offer',
      } as unknown as ReturnType<typeof jsQR>);

      const onResult = vi.fn();
      const stop = startQrScanner(mockVideo, onResult);

      await vi.waitFor(() => {
        expect(onResult).toHaveBeenCalledWith('jsqr-decoded-offer');
      });

      expect(jsQR).toHaveBeenCalled();
      stop();
    });

    it('stops scanning when cleanup function is invoked', async () => {
      delete (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector;
      vi.mocked(jsQR).mockReturnValue(null); // No code found

      const onResult = vi.fn();
      const stop = startQrScanner(mockVideo, onResult);

      // Stop immediately
      stop();

      // Ensure that if a new code appears later, it is never dispatched because stopped is true
      vi.mocked(jsQR).mockReturnValue({ data: 'late-code' } as unknown as ReturnType<typeof jsQR>);

      await new Promise((r) => setTimeout(r, 50));
      expect(onResult).not.toHaveBeenCalled();
    });
  });
});
