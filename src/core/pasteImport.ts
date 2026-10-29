import type { CharacterCardV3 } from '../schemas/cardSchema';
import { LIMITS } from '../schemas/limits';
import { importCardData } from '../io';
import { normalizeRawToV3Card } from '../io/converter';

export type PasteReadKind =
  | 'card-json'
  | 'lorebook-json'
  | 'unknown-json'
  | 'labeled-text'
  | 'plain-text'
  | 'empty'
  | 'error';

export interface PasteReadResult {
  kind: PasteReadKind;
  card?: CharacterCardV3;
  embeddedAssets?: Record<string, Uint8Array>;
  filled: string[];
  addedToDescription: string[];
  warnings: string[];
  error?: string;
}

type DataRecord = Record<string, unknown>;

const MAX_INPUT_LENGTH = 1_000_000;

const FIELD_ALIASES: Record<string, string> = {
  name: 'name',
  charactername: 'name',
  charname: 'name',
  character: 'name',
  title: 'name',
  description: 'description',
  bio: 'description',
  biography: 'description',
  backstory: 'description',
  background: 'description',
  history: 'description',
  story: 'description',
  about: 'description',
  summary: 'description',
  profile: 'description',
  overview: 'description',
  personality: 'personality',
  traits: 'personality',
  persona: 'personality',
  temperament: 'personality',
  charactertraits: 'personality',
  scenario: 'scenario',
  setting: 'scenario',
  situation: 'scenario',
  world: 'scenario',
  context: 'scenario',
  firstmessage: 'first_mes',
  firstmes: 'first_mes',
  greeting: 'first_mes',
  opening: 'first_mes',
  openingmessage: 'first_mes',
  openingline: 'first_mes',
  startingmessage: 'first_mes',
  examples: 'mes_example',
  exampledialogue: 'mes_example',
  exampledialogues: 'mes_example',
  dialogueexamples: 'mes_example',
  mesexample: 'mes_example',
  sampledialogue: 'mes_example',
  systemprompt: 'system_prompt',
  posthistoryinstructions: 'post_history_instructions',
  jailbreak: 'post_history_instructions',
  creatornotes: 'creator_notes',
  notes: 'creator_notes',
  creator: 'creator',
  author: 'creator',
  tags: 'tags',
  alternategreetings: 'alternate_greetings',
  greetings: 'alternate_greetings',
};

const LOREBOOK_KEYS = new Set(['characterbook', 'lorebook', 'worldinfo']);
const CARD_SHAPE_KEYS = new Set([
  'name',
  'char_name',
  'description',
  'personality',
  'scenario',
  'first_mes',
  'char_greeting',
  'greeting',
]);

function emptyResult(kind: PasteReadKind): PasteReadResult {
  return { kind, filled: [], addedToDescription: [], warnings: [] };
}

function isRecord(value: unknown): value is DataRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isKnownLabel(label: string): boolean {
  const key = normalizeKey(label);
  return Object.prototype.hasOwnProperty.call(FIELD_ALIASES, key) || LOREBOOK_KEYS.has(key);
}

function extractFirstBalancedBlock(input: string): string | null {
  let start = -1;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === '{' && input[i + 1] === '{') {
      i++;
      continue;
    }
    if (input[i] === '{' || input[i] === '[') {
      start = i;
      break;
    }
  }
  if (start < 0) return null;

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i++) {
    const char = input[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{' || char === '[') {
      stack.push(char);
      continue;
    }
    if (char === '}' || char === ']') {
      const opening = stack.pop();
      if ((char === '}' && opening !== '{') || (char === ']' && opening !== '[')) {
        return null;
      }
      if (stack.length === 0) return input.slice(start, i + 1);
    }
  }
  return null;
}

function removeTrailingCommas(input: string): string {
  let output = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === ',') {
      let next = i + 1;
      while (next < input.length && /\s/.test(input[next])) next++;
      if (input[next] === '}' || input[next] === ']') continue;
    }
    output += char;
  }

  return output;
}

interface CleanInput {
  original: string;
  candidate: string;
  labeledFallback: string | null;
}

function parseJsonCandidate(candidate: string): unknown | null {
  try {
    return JSON.parse(removeTrailingCommas(candidate).trim());
  } catch {
    return null;
  }
}

function cleanInput(input: string): CleanInput {
  const original = input.replace(/^\uFEFF/, '').trim();
  const fenceMarker = String.fromCharCode(96).repeat(3);
  const fencePattern = new RegExp(fenceMarker + '(?:[A-Za-z0-9_-]+)?[ \t]*\r?\n?([\s\S]*?)' + fenceMarker);
  const fence = original.match(fencePattern);

  if (fence) {
    const fencedCandidate = fence[1].trim();
    if (parseJsonCandidate(fencedCandidate) !== null) {
      return { original, candidate: fencedCandidate, labeledFallback: null };
    }
    if (readLabeledText(fencedCandidate)) {
      return { original, candidate: original, labeledFallback: fencedCandidate };
    }
    return { original, candidate: original, labeledFallback: null };
  }

  if (!original.startsWith('{') && !original.startsWith('[')) {
    const block = extractFirstBalancedBlock(original);
    if (block && parseJsonCandidate(block) !== null) {
      return { original, candidate: block.trim(), labeledFallback: null };
    }
  }

  return { original, candidate: original, labeledFallback: null };
}

function cardHasKnownField(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Object.keys(value).some((key) => CARD_SHAPE_KEYS.has(key));
}

function isCardShaped(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.spec === 'chara_card_v2' || value.spec === 'chara_card_v3') return true;

  const candidateKeys = ['data', 'character', 'card', 'result', 'definition', 'character_card'];
  if (cardHasKnownField(value)) return true;
  return candidateKeys.some((key) => cardHasKnownField(value[key]));
}

function renameLooseLorebookKeys(record: DataRecord): boolean {
  const keys = Object.keys(record);
  if (keys.includes('character_book') || keys.includes('world_info')) return false;

  const looseKey = keys.find((key) => {
    const normalized = normalizeKey(key);
    return normalized === 'lorebook' || normalized === 'worldinfo';
  });
  if (!looseKey) return false;

  record.character_book = record[looseKey];
  delete record[looseKey];
  return true;
}

function normalizeCardLorebookKeys(card: DataRecord): boolean {
  let changed = renameLooseLorebookKeys(card);
  if (isRecord(card.data)) changed = renameLooseLorebookKeys(card.data) || changed;
  return changed;
}

function stringValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value.join(', ');
  }
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? String(value) : serialized;
  } catch {
    return String(value);
  }
}

function filledFields(card: CharacterCardV3): string[] {
  const data = card.data;
  const filled: string[] = [];
  if (data.name.trim()) filled.push('Name');
  if (data.description.trim()) filled.push('Description');
  if (data.personality.trim()) filled.push('Personality');
  if (data.scenario.trim()) filled.push('Scenario');
  if (data.first_mes.trim()) filled.push('First message');
  if (data.mes_example.trim()) filled.push('Example dialogue');
  if (data.system_prompt.trim()) filled.push('System prompt');
  if (data.post_history_instructions.trim()) filled.push('Post-history instructions');
  if (data.creator_notes.trim()) filled.push('Creator notes');
  if (data.creator.trim()) filled.push('Creator');
  if (data.tags.length > 0) filled.push('Tags');
  if (data.alternate_greetings.length > 0) filled.push('Alternate greetings');
  if (data.character_book) filled.push('Lorebook');
  return filled;
}

function resultForCard(
  kind: PasteReadKind,
  card: CharacterCardV3,
  warnings: string[],
  addedToDescription: string[] = [],
  embeddedAssets?: Record<string, Uint8Array>
): PasteReadResult {
  return {
    kind,
    card,
    embeddedAssets,
    filled: filledFields(card),
    addedToDescription,
    warnings,
  };
}

function mapFields(entries: Array<[string, unknown]>, kind: 'unknown-json' | 'labeled-text', prefixWarnings: string[] = []): PasteReadResult {
  const flat: DataRecord = Object.create(null) as DataRecord;
  const unmatched: Array<{ key: string; value: unknown }> = [];
  const addedToDescription: string[] = [];

  for (const [sourceKey, sourceValue] of entries) {
    const normalizedKey = normalizeKey(sourceKey);
    let target = FIELD_ALIASES[normalizedKey];
    const isLorebook = LOREBOOK_KEYS.has(normalizedKey);
    if (isLorebook) target = 'character_book';

    if (!target) {
      unmatched.push({ key: sourceKey, value: sourceValue });
      addedToDescription.push(sourceKey);
      continue;
    }

    if (target === 'alternate_greetings' && (!Array.isArray(sourceValue) || !sourceValue.every((item) => typeof item === 'string'))) {
      unmatched.push({ key: sourceKey, value: sourceValue });
      addedToDescription.push(sourceKey);
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(flat, target)) {
      unmatched.push({ key: sourceKey, value: sourceValue });
      addedToDescription.push(sourceKey);
      continue;
    }

    if (isLorebook) {
      flat[target] = sourceValue;
    } else if (target === 'tags' && Array.isArray(sourceValue) && sourceValue.every((item) => typeof item === 'string')) {
      flat[target] = sourceValue;
    } else if (target === 'alternate_greetings') {
      flat[target] = sourceValue;
    } else {
      flat[target] = stringValue(sourceValue);
    }
  }

  const existingDescription = typeof flat.description === 'string' ? flat.description : '';
  const extraLines = unmatched.map((item) => item.key + ': ' + stringValue(item.value));
  const descriptionParts = [existingDescription, ...extraLines].filter((part) => part.length > 0);
  if (descriptionParts.length > 0) flat.description = descriptionParts.join('\n\n');

  const normalized = normalizeRawToV3Card(flat);
  if (!Object.prototype.hasOwnProperty.call(flat, 'name')) normalized.card.data.name = '';

  const warnings = [...prefixWarnings, ...normalized.warnings.filter((warning) => !warning.includes(' — defaulted to ') && !warning.includes('missing `'))];
  if (unmatched.length > 0) {
    warnings.push('Some data had no matching field and was added to Description.');
  }
  if (normalized.card.data.description.length > LIMITS.LONG_TEXT) {
    warnings.push('Description is longer than the card limit; shorten it before export.');
  }

  return resultForCard(kind, normalized.card, warnings, addedToDescription);
}

interface ParsedLabel {
  label: string;
  value: string;
  lineIndex: number;
}

function parseKnownLabel(line: string): { label: string; value: string } | null {
  const heading = line.match(/^\s*#{1,6}\s+(.{1,40}?)\s*$/);
  if (heading && isKnownLabel(heading[1])) return { label: heading[1].trim(), value: '' };

  const colon = line.match(/^\s*(?:#{1,6}\s*|\*\*\s*|\[\s*|-\s*)?([^:\n]{1,40}?)(?:\s*\*\*)?(?:\]\s*)?:\s*(.*)$/);
  if (!colon) return null;
  const label = colon[1].replace(/\*\*/g, '').replace(/\]/g, '').trim();
  if (!isKnownLabel(label)) return null;
  return { label, value: colon[2] };
}

function readLabeledText(input: string, prefixWarnings: string[] = []): PasteReadResult | null {
  const lines = input.split(/\r?\n/);
  const labels: ParsedLabel[] = [];
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseKnownLabel(lines[i]);
    if (parsed) labels.push({ ...parsed, lineIndex: i });
  }
  if (labels.length < 2) return null;

  const firstLabelLine = labels[0].lineIndex;
  const entries: Array<[string, unknown]> = [];
  const preamble = lines.slice(0, firstLabelLine).join('\n').trim();
  if (preamble) entries.push(['Description', preamble]);

  for (let i = 0; i < labels.length; i++) {
    const current = labels[i];
    const nextStart = i + 1 < labels.length ? labels[i + 1].lineIndex : lines.length;
    const continuation = lines.slice(current.lineIndex + 1, nextStart);
    const value = [current.value, ...continuation].join('\n').trim();
    entries.push([current.label, value]);
  }

  return mapFields(entries, 'labeled-text', prefixWarnings);
}

function errorResult(message: string): PasteReadResult {
  return { ...emptyResult('error'), error: message };
}

async function readPastedTextImpl(text: string): Promise<PasteReadResult> {
  if (text.length > MAX_INPUT_LENGTH) {
    return errorResult('Pasted text exceeds the 1,000,000 character limit.');
  }

  const cleaned = cleanInput(text);
  if (!cleaned.original) return emptyResult('empty');

  let parsed: unknown;
  try {
    parsed = JSON.parse(removeTrailingCommas(cleaned.candidate).trim());
  } catch {
    const labeledInput = cleaned.labeledFallback ?? cleaned.original;
    const labeled = readLabeledText(labeledInput);
    if (labeled) return labeled;

    const normalized = normalizeRawToV3Card({ name: '', description: cleaned.original });
    normalized.card.data.name = '';
    const warnings = [
      ...normalized.warnings.filter((warning) => !warning.includes(' — defaulted to ') && !warning.includes('missing `')),
      'Nothing recognized. The text was saved as Description. Add a name before creating.',
    ];
    if (normalized.card.data.description.length > LIMITS.LONG_TEXT) {
      warnings.push('Description is longer than the card limit; shorten it before export.');
    }
    return resultForCard('plain-text', normalized.card, warnings);
  }

  const prefixWarnings: string[] = [];
  let cardJsonText = removeTrailingCommas(cleaned.candidate).trim();
  if (Array.isArray(parsed)) {
    const count = parsed.length;
    if (count === 0 || !isRecord(parsed[0])) {
      return errorResult('The JSON array must contain a character object as its first item.');
    }
    parsed = parsed[0];
    cardJsonText = JSON.stringify(parsed);
    prefixWarnings.push(count + ' items found; only the first was used.');
  }

  if (!isRecord(parsed)) {
    return errorResult('The pasted JSON must contain a character object.');
  }

  if (parsed.spec === 'lorebook_v3') {
    return { ...emptyResult('lorebook-json'), warnings: [...prefixWarnings, 'This is a lorebook, not a character. Import it from the Lorebook screen.'] };
  }

  if (isCardShaped(parsed)) {
    const renamedCopy = JSON.parse(JSON.stringify(parsed)) as DataRecord;
    const changed = normalizeCardLorebookKeys(renamedCopy);
    const inputForImporter = changed || cardJsonText !== cleaned.original ? JSON.stringify(renamedCopy) : cleaned.original;
    const imported = await importCardData(inputForImporter);
    if (!imported.card) {
      return errorResult('The JSON did not produce a character card.');
    }
    return resultForCard(
      'card-json',
      imported.card,
      [...prefixWarnings, ...(imported.warnings || []).filter((warning) => !warning.includes(' — defaulted to ') && !warning.includes('missing `'))],
      [],
      imported.embeddedAssets
    );
  }

  return mapFields(Object.entries(parsed), 'unknown-json', prefixWarnings);
}

export async function readPastedText(text: string): Promise<PasteReadResult> {
  try {
    return await readPastedTextImpl(text);
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : 'Unable to read pasted text.');
  }
}
