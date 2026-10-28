import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { readCardFromCharx } from '../src/io/charx';
import { CharacterCardV3 } from '../src/schemas/cardSchema';

describe('charx io', () => {
  const dummyCard: CharacterCardV3 = {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name: 'Test',
      description: 'Test',
      personality: '',
      scenario: '',
      first_mes: '',
      mes_example: '',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      tags: [],
      creator: '',
      character_version: '',
      alternate_greetings: [],
      group_only_greetings: [],
      extensions: {},
      entries: []
    }
  };

  it('rejects zip entry count cap exceeded', async () => {
    const zip = new JSZip();
    for (let i = 0; i < 505; i++) {
      zip.file(`file${i}.txt`, 'hello');
    }
    const buffer = await zip.generateAsync({ type: 'uint8array' });
    await expect(readCardFromCharx(buffer)).rejects.toThrow(/max entry count/);
  });

  it('rejects path traversal', async () => {
    const zip = new JSZip();
    zip.file('/evil.txt', 'hello');
    zip.file('card.json', JSON.stringify(dummyCard));
    const buffer = await zip.generateAsync({ type: 'uint8array' });
    await expect(readCardFromCharx(buffer)).rejects.toThrow(/Path traversal/);
  });

  it('rejects zip bomb / compression ratio', async () => {
    const zip = new JSZip();
    zip.file('card.json', JSON.stringify(dummyCard));
    
    // Create a highly compressible payload
    const payload = new Uint8Array(2 * 1024 * 1024); // 2MB of zeros
    zip.file('big.txt', payload);
    
    // The zip will compress this to almost nothing.
    const buffer = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    
    // Wait, the logic is: totalUncompressed / compressedArchiveSize > MAX_COMPRESSION_RATIO
    // For 2MB of 0s, the zip might be ~200 bytes. 2MB / 200 > 10000. This triggers the bomb check.
    await expect(readCardFromCharx(buffer)).rejects.toThrow(/Suspicious compression ratio/);
  });
});
