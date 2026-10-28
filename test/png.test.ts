import { describe, it, expect, vi } from 'vitest';
import { readCardFromPng } from '../src/io/png';
import extractChunks from 'png-chunks-extract';

vi.mock('png-chunks-extract', () => ({
  default: vi.fn((buf: Uint8Array) => {
    // Default implementation if needed, or actual extractChunks logic for un-mocked calls
    if (buf.length > 20 * 1024 * 1024) return [];
    return [{ name: 'IHDR', data: new Uint8Array(13) }];
  }),
}));

describe('png io', () => {
  it('rejects oversized png file upfront', () => {
    const bigFile = new Uint8Array(25 * 1024 * 1024);
    expect(() => readCardFromPng(bigFile)).toThrow(/exceeds maximum limit/);
  });

  it('rejects oversized tEXt chunk', () => {
    const smallPng = new Uint8Array(100);
    vi.mocked(extractChunks).mockReturnValueOnce([
      { name: 'IHDR', data: new Uint8Array(13) },
      { name: 'tEXt', data: new Uint8Array(21 * 1024 * 1024) },
    ]);

    expect(() => readCardFromPng(smallPng)).toThrow(/tEXt chunk size \(21MB\) exceeds maximum limit/);
  });
});


