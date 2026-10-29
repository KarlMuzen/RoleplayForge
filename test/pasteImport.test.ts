import { describe, expect, it } from 'vitest';
import { readPastedText } from '../src/core/pasteImport';

describe('readPastedText', () => {
  it('returns empty for empty and whitespace-only text', async () => {
    expect((await readPastedText('')).kind).toBe('empty');
    expect((await readPastedText(' \n\t ')).kind).toBe('empty');
  });

  it('reads a V3 character card and reports its name and first message', async () => {
    const result = await readPastedText(JSON.stringify({
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: { name: 'A', description: 'B', first_mes: 'Hello' },
    }));
    expect(result.kind).toBe('card-json');
    expect(result.card?.data.name).toBe('A');
    expect(result.card?.data.first_mes).toBe('Hello');
    expect(result.filled).toContain('Name');
    expect(result.filled).toContain('First message');
  });

  it('reads a V2 character card', async () => {
    const result = await readPastedText(JSON.stringify({
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: { name: 'V2 card', first_mes: 'Hello' },
    }));
    expect(result.kind).toBe('card-json');
    expect(result.card?.data.name).toBe('V2 card');
  });

  it('reads V1-style flat character JSON', async () => {
    const result = await readPastedText('{"name":"A","description":"B","first_mes":"C"}');
    expect(result.kind).toBe('card-json');
    expect(result.card?.data.name).toBe('A');
    expect(result.card?.data.description).toBe('B');
    expect(result.card?.data.first_mes).toBe('C');
  });

  it('reads fenced JSON and JSON preceded by a sentence', async () => {
    const json = '{"name":"A","description":"B","first_mes":"C"}';
    const fence = String.fromCharCode(96).repeat(3);
    expect((await readPastedText(fence + 'json\n' + json + '\n' + fence)).card?.data.name).toBe('A');
    expect((await readPastedText('Here is the card: ' + json)).card?.data.name).toBe('A');
  });

  it('accepts trailing commas', async () => {
    const result = await readPastedText('{"name":"A","description":"B",}');
    expect(result.kind).toBe('card-json');
    expect(result.card?.data.name).toBe('A');
  });

  it('does not cut JSON early when braces appear inside a string', async () => {
    const result = await readPastedText('Details: {"name":"A","description":"use { and }"}');
    expect(result.kind).toBe('card-json');
    expect(result.card?.data.description).toBe('use { and }');
  });

  it('maps unfamiliar JSON fields and preserves unknown values in Description', async () => {
    const result = await readPastedText('{"Character Name":"Mira","Backstory":"b","Opening Line":"hi","Hair":"red","Age":27}');
    expect(result.kind).toBe('unknown-json');
    expect(result.card?.data.name).toBe('Mira');
    expect(result.card?.data.description.startsWith('b')).toBe(true);
    expect(result.card?.data.description).toContain('Hair: red');
    expect(result.card?.data.description).toContain('Age: 27');
    expect(result.card?.data.first_mes).toBe('hi');
    expect(result.addedToDescription).toContain('Hair');
    expect(result.addedToDescription).toContain('Age');
  });

  it('keeps a later duplicate description alias in Description instead of overwriting', async () => {
    const result = await readPastedText('{"Bio":"x","Backstory":"y"}');
    expect(result.card?.data.description.startsWith('x')).toBe(true);
    expect(result.card?.data.description).toContain('Backstory: y');
    expect(result.addedToDescription).toContain('Backstory');
  });

  it('maps unknown JSON world_info lorebook entries', async () => {
    const result = await readPastedText(JSON.stringify({
      World_Info: { entries: [{ keys: ['k'], content: 'c' }] },
    }));
    expect(result.kind).toBe('unknown-json');
    expect(result.card?.data.character_book?.entries).toHaveLength(1);
  });

  it.each(['lorebook', 'worldinfo'])('maps the %s JSON key to a character lorebook', async (key) => {
    const value = { entries: [{ keys: ['k'], content: 'c' }] };
    const result = await readPastedText(JSON.stringify({ [key]: value }));
    expect(result.kind).toBe('unknown-json');
    expect(result.card?.data.character_book?.entries).toHaveLength(1);
  });

  it('renames loose lorebook keys in card-shaped JSON before using the existing importer', async () => {
    const result = await readPastedText(JSON.stringify({
      name: 'A',
      lorebook: { entries: [{ keys: ['k'], content: 'c' }] },
    }));
    expect(result.kind).toBe('card-json');
    expect(result.card?.data.character_book?.entries).toHaveLength(1);
  });

  it('detects standalone lorebook JSON and does not return a character', async () => {
    const result = await readPastedText('{"spec":"lorebook_v3","data":{"entries":[]}}');
    expect(result.kind).toBe('lorebook-json');
    expect(result.card).toBeUndefined();
  });

  it('uses the first item in a JSON array and warns about remaining items', async () => {
    const result = await readPastedText('[{"name":"First"},{"name":"Second"}]');
    expect(result.kind).toBe('card-json');
    expect(result.card?.data.name).toBe('First');
    expect(result.warnings).toContain('2 items found; only the first was used.');
  });

  it('maps labeled text and preserves multi-line values', async () => {
    const result = await readPastedText(
      'Name: Mira\nPersonality:\nCurious and kind\nOften asks questions\nScenario: On a ship\nFirst message: Hello, {{user}}.'
    );
    expect(result.kind).toBe('labeled-text');
    expect(result.card?.data.name).toBe('Mira');
    expect(result.card?.data.personality).toContain('Curious and kind');
    expect(result.card?.data.personality).toContain('Often asks questions');
    expect(result.card?.data.scenario).toBe('On a ship');
    expect(result.card?.data.first_mes).toBe('Hello, {{user}}.');
  });

  it('recognizes Markdown headings as labels', async () => {
    const result = await readPastedText('Name: Mira\n## Personality\nCalm\nKind');
    expect(result.kind).toBe('labeled-text');
    expect(result.card?.data.personality).toContain('Calm');
    expect(result.card?.data.personality).toContain('Kind');
  });

  it('keeps unknown colon lines inside a field value', async () => {
    const result = await readPastedText('Name: Mira\nDescription: A person\nNote: be kind');
    expect(result.kind).toBe('labeled-text');
    expect(result.card?.data.description).toContain('Note: be kind');
  });

  it('treats prose with only one known label as plain text', async () => {
    const result = await readPastedText('This is a short note.\nName: Mira');
    expect(result.kind).toBe('plain-text');
    expect(result.card?.data.description).toContain('Name: Mira');
  });

  it('stores plain prose as Description without inventing a name or first message', async () => {
    const source = 'A wandering knight\nwith a quiet past.';
    const result = await readPastedText(source);
    expect(result.kind).toBe('plain-text');
    expect(result.card?.data.name).toBe('');
    expect(result.card?.data.description).toBe(source);
    expect(result.card?.data.first_mes).toBe('');
  });

  it('rejects input over one million characters', async () => {
    expect((await readPastedText('x'.repeat(1_000_001))).kind).toBe('error');
  });

  it('does not pollute Object.prototype when parsing a proto key', async () => {
    const result = await readPastedText('{"__proto__":{"x":1},"name":"A"}');
    expect(result.card?.data.name).toBe('A');
    expect(({} as { x?: number }).x).toBeUndefined();
  });

  it('preserves bracketed values and prose when they are not valid JSON', async () => {
    const labeledSource = 'Name: Mira\nPersonality: [kind, shy]\nScenario: A bakery\nFirst message: Hello!';
    const labeled = await readPastedText(labeledSource);
    expect(labeled.kind).toBe('labeled-text');
    expect(labeled.card?.data.personality).toContain('[kind, shy]');
    expect(labeled.card?.data.scenario).toContain('A bakery');
    expect(labeled.card?.data.first_mes).toContain('Hello!');

    const proseSource = 'Mira is a baker [age 27] who loves bread.';
    const prose = await readPastedText(proseSource);
    expect(prose.kind).toBe('plain-text');
    expect(prose.card?.data.description).toBe(proseSource);
  });

  it('preserves text surrounding a mid-text fence that is not JSON or labeled data', async () => {
    const fence = String.fromCharCode(96).repeat(3);
    const source = 'Intro text here.\n' + fence + 'code' + fence + '\nOutro text here.';
    const result = await readPastedText(source);
    expect(result.kind).toBe('plain-text');
    expect(result.card?.data.description).toBe(source);
    expect(result.card?.data.description).toContain('Intro text here.');
    expect(result.card?.data.description).toContain('code');
    expect(result.card?.data.description).toContain('Outro text here.');
  });

  it('maps capitalized JSON keys instead of treating them as card-shaped', async () => {
    const result = await readPastedText('{"Name":"Mira","Description":"Baker","Greeting":"Hi"}');
    expect(result.kind).toBe('unknown-json');
    expect(result.card?.data.name).toBe('Mira');
    expect(result.card?.data.description).toBe('Baker');
    expect(result.card?.data.first_mes).toBe('Hi');
  });

  it('does not show defaulted-field warnings for a plain V1 card JSON', async () => {
    const result = await readPastedText('{"name":"A","description":"B","first_mes":"C"}');
    expect(result.kind).toBe('card-json');
    expect(result.warnings.some((warning) => warning.includes('defaulted'))).toBe(false);
  });

  it('returns a result instead of throwing for malformed input', async () => {
    await expect(readPastedText('{{{')).resolves.toMatchObject({ kind: 'plain-text' });
    await expect(readPastedText('{\"name\":')).resolves.toMatchObject({ kind: 'plain-text' });
  });
});
