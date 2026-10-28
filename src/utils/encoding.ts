import { utf8ToBase64, base64ToUtf8, b642buf } from './binaryEncoding';

export { utf8ToBase64, base64ToUtf8 };

// Valid 1x1 transparent PNG base64
const DUMMY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export function createDummyPng(): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(DUMMY_PNG_BASE64, 'base64');
  }
  return b642buf(DUMMY_PNG_BASE64);
}
