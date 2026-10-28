import { getDefaultedFields, summarizeDefaultedFields } from '../utils/validation';
import {
  CharacterCardV2Schema,
  CharacterCardV3Schema,
  type CharacterCardV2,
  type CharacterCardV3,
} from '../schemas/cardSchema';
import { normalizeLorebook } from '../utils/normalizeLorebook';

export function sanitizeObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    clean[key] = sanitizeObject(value);
  }
  return clean as T;
}

export function normalizeRawToV3Card(
  rawInput: unknown,
  fileName?: string
): { card: CharacterCardV3; warnings: string[] } {
  const warnings: string[] = [];
  const raw = (sanitizeObject(rawInput) || {}) as Record<string, unknown>;

  // Find inner card data object if nested
  let cardData: Record<string, unknown> = raw;
  if (raw && typeof raw === 'object') {
    const rawData = raw.data as Record<string, unknown> | undefined;
    const rawChar = raw.character as Record<string, unknown> | undefined;
    const rawCard = raw.card as Record<string, unknown> | undefined;
    const rawResult = raw.result as Record<string, unknown> | undefined;
    const rawDef = raw.definition as Record<string, unknown> | undefined;
    const rawCC = raw.character_card as Record<string, unknown> | undefined;

    if (raw.spec === 'chara_card_v3' && rawData && typeof rawData === 'object') {
      cardData = rawData;
    } else if (raw.spec === 'chara_card_v2' && rawData && typeof rawData === 'object') {
      cardData = rawData;
    } else if (
      rawData &&
      typeof rawData === 'object' &&
      (rawData.name !== undefined ||
        rawData.description !== undefined ||
        rawData.first_mes !== undefined ||
        rawData.personality !== undefined)
    ) {
      cardData = rawData;
    } else if (rawChar && typeof rawChar === 'object') {
      cardData = rawChar;
    } else if (rawCard && typeof rawCard === 'object') {
      cardData = rawCard;
    } else if (rawResult && typeof rawResult === 'object') {
      cardData = rawResult;
    } else if (rawDef && typeof rawDef === 'object') {
      cardData = rawDef;
    } else if (rawCC && typeof rawCC === 'object') {
      cardData = rawCC;
    }
  }

  // Extract name
  const name = String(
    cardData.name ||
      cardData.char_name ||
      cardData.character_name ||
      cardData.nickname ||
      raw.name ||
      raw.char_name ||
      (fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') : '') ||
      'Untitled Character'
  ).trim();

  // Extract description
  const description = String(
    cardData.description ||
      cardData.char_persona ||
      cardData.char_description ||
      cardData.summary ||
      raw.description ||
      ''
  );

  // Extract personality
  const personality = String(
    cardData.personality ||
      cardData.persona ||
      raw.personality ||
      ''
  );

  // Extract scenario
  const scenario = String(
    cardData.scenario ||
      cardData.world_scenario ||
      cardData.char_scenario ||
      raw.scenario ||
      ''
  );

  // Extract first message / greeting
  const first_mes = String(
    cardData.first_mes ||
      cardData.char_greeting ||
      cardData.first_message ||
      cardData.greeting ||
      raw.first_mes ||
      raw.greeting ||
      ''
  );

  // Extract message example
  const mes_example = String(
    cardData.mes_example ||
      cardData.example_dialogue ||
      cardData.definition ||
      cardData.mes_examples ||
      raw.mes_example ||
      ''
  );

  // Extract creator notes
  const creator_notes = String(
    cardData.creator_notes ||
      cardData.comment ||
      cardData.notes ||
      raw.creator_notes ||
      ''
  );

  // Extract system prompt
  const system_prompt = String(
    cardData.system_prompt ||
      cardData.prompt ||
      raw.system_prompt ||
      ''
  );

  // Extract post history instructions
  const post_history_instructions = String(
    cardData.post_history_instructions ||
      cardData.depth_prompt ||
      raw.post_history_instructions ||
      ''
  );

  // Extract creator
  const creator = String(
    cardData.creator ||
      cardData.author ||
      raw.creator ||
      raw.author ||
      ''
  );

  // Extract character version
  const character_version = String(
    cardData.character_version ||
      cardData.version ||
      raw.character_version ||
      ''
  );

  // Extract tags
  let tags: string[] = [];
  const rawTags = cardData.tags ?? raw.tags;
  if (Array.isArray(rawTags)) {
    tags = rawTags.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof rawTags === 'string') {
    tags = rawTags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  // Extract alternate greetings
  let alternate_greetings: string[] = [];
  const rawAltGreetings = cardData.alternate_greetings ?? raw.alternate_greetings;
  if (Array.isArray(rawAltGreetings)) {
    alternate_greetings = rawAltGreetings.map((g) => String(g)).filter(Boolean);
  } else if (typeof rawAltGreetings === 'string' && rawAltGreetings.trim()) {
    alternate_greetings = [rawAltGreetings.trim()];
  }

  // Extract group only greetings
  let group_only_greetings: string[] = [];
  const rawGrpGreetings = cardData.group_only_greetings ?? raw.group_only_greetings;
  if (Array.isArray(rawGrpGreetings)) {
    group_only_greetings = rawGrpGreetings.map((g) => String(g)).filter(Boolean);
  }

  // Normalize character_book / lorebook
  const character_book = normalizeLorebook(cardData) || normalizeLorebook(raw) || null;

  // Assets
  let assets = Array.isArray(cardData.assets)
    ? cardData.assets
    : Array.isArray(raw.assets)
    ? raw.assets
    : [];

  // Filter and sanitize assets
  assets = assets
    .filter((a: any) => a && typeof a === 'object')
    .map((a: any) => ({
      type: String(a.type || 'image'),
      uri: String(a.uri || 'ccdefault:'),
      name: String(a.name || 'asset'),
      ext: String(a.ext || 'png'),
    }));

  if (!assets.some((a) => a.type === 'icon')) {
    const extensionsObj =
      cardData.extensions && typeof cardData.extensions === 'object'
        ? (cardData.extensions as Record<string, unknown>)
        : undefined;
    const avatarVal =
      cardData.avatar ||
      extensionsObj?.avatar ||
      raw.avatar ||
      cardData.image ||
      raw.image ||
      cardData.icon ||
      raw.icon;
    let uri = 'ccdefault:';
    let ext = 'png';
    if (typeof avatarVal === 'string' && avatarVal.trim()) {
      const trimmed = avatarVal.trim();
      if (
        trimmed.startsWith('data:image/') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('embeded://') ||
        trimmed.startsWith('ccdefault:') ||
        trimmed.startsWith('chara-ext-asset_:')
      ) {
        uri = trimmed;
        if (trimmed.startsWith('data:image/')) {
          ext = trimmed.split(';')[0].split('/')[1] || 'png';
        }
      }
    }
    assets.unshift({
      type: 'icon',
      uri,
      name: 'main',
      ext,
    });
  }

  // Extensions isolation
  const HANDLED_KEYS = new Set([
    'name', 'char_name', 'character_name', 'nickname',
    'description', 'char_persona', 'char_description', 'summary',
    'personality', 'persona',
    'scenario', 'world_scenario', 'char_scenario',
    'first_mes', 'char_greeting', 'first_message', 'greeting',
    'mes_example', 'example_dialogue', 'definition', 'mes_examples',
    'creator_notes', 'comment', 'notes',
    'system_prompt', 'prompt',
    'post_history_instructions', 'depth_prompt',
    'creator', 'author',
    'character_version', 'version',
    'tags', 'alternate_greetings', 'group_only_greetings',
    'character_book', 'world_info',
    'assets', 'avatar', 'image', 'icon',
    'creation_date', 'modification_date', 'source', 'creator_notes_multilingual',
    'spec', 'spec_version', 'data', 'character', 'card', 'result', 'character_card', 'extensions'
  ]);

  const extensions: Record<string, any> = {
    ...(typeof raw.extensions === 'object' ? raw.extensions : {}),
    ...(typeof cardData.extensions === 'object' ? cardData.extensions : {}),
  };

  for (const [k, v] of Object.entries(cardData)) {
    if (!HANDLED_KEYS.has(k) && v !== undefined) {
      extensions[k] = v;
    }
  }
  for (const [k, v] of Object.entries(raw)) {
    if (!HANDLED_KEYS.has(k) && v !== undefined) {
      extensions[k] = v;
    }
  }

  const now = Math.floor(Date.now() / 1000);

  const creation_date = typeof cardData.creation_date === 'number'
    ? cardData.creation_date
    : typeof raw.creation_date === 'number'
    ? raw.creation_date
    : now;

  const modification_date = typeof cardData.modification_date === 'number'
    ? cardData.modification_date
    : typeof raw.modification_date === 'number'
    ? raw.modification_date
    : now;

  const rawSource = Array.isArray(cardData.source)
    ? cardData.source
    : Array.isArray(raw.source)
    ? raw.source
    : undefined;
  const source = rawSource ? rawSource.filter((s): s is string => typeof s === 'string') : undefined;

  const rawMultilingual = cardData.creator_notes_multilingual && typeof cardData.creator_notes_multilingual === 'object'
    ? cardData.creator_notes_multilingual
    : raw.creator_notes_multilingual && typeof raw.creator_notes_multilingual === 'object'
    ? raw.creator_notes_multilingual
    : undefined;
  const creator_notes_multilingual = rawMultilingual as Record<string, string> | undefined;

  const nickname = typeof cardData.nickname === 'string'
    ? cardData.nickname
    : typeof raw.nickname === 'string'
    ? raw.nickname
    : undefined;

  const v3Candidate: CharacterCardV3 = {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name,
      description,
      tags,
      creator,
      character_version,
      mes_example,
      extensions,
      system_prompt,
      post_history_instructions,
      first_mes,
      alternate_greetings,
      group_only_greetings,
      personality,
      scenario,
      creator_notes,
      character_book,
      assets,
      nickname,
      creator_notes_multilingual,
      source,
      creation_date,
      modification_date,
    },
  };

  const parsedCard = CharacterCardV3Schema.parse(v3Candidate);

  const defaulted = getDefaultedFields(cardData, parsedCard.data);
  if (defaulted.length > 0) {
    warnings.push(...summarizeDefaultedFields(defaulted));
  }

  return { card: parsedCard, warnings };
}

export function convertV2ToV3(v2Card: CharacterCardV2): CharacterCardV3 {
  const d = v2Card.data;
  const now = Math.floor(Date.now() / 1000);

  const characterBook = normalizeLorebook(v2Card) || d.character_book;

  const v3Card: CharacterCardV3 = {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name: d.name || '',
      description: d.description || '',
      tags: d.tags || [],
      creator: d.creator || '',
      character_version: d.character_version || '',
      mes_example: d.mes_example || '',
      extensions: d.extensions || {},
      system_prompt: d.system_prompt || '',
      post_history_instructions: d.post_history_instructions || '',
      first_mes: d.first_mes || '',
      alternate_greetings: d.alternate_greetings || [],
      personality: d.personality || '',
      scenario: d.scenario || '',
      creator_notes: d.creator_notes || '',
      character_book: characterBook,
      group_only_greetings: [],
      assets: [
        {
          type: 'icon',
          uri: 'ccdefault:',
          name: 'main',
          ext: 'png',
        },
      ],
      creation_date: now,
      modification_date: now,
    },
  };

  return CharacterCardV3Schema.parse(v3Card);
}

export const BACKFILL_V2_WARNING =
  'This character card is Character Card V3, but it is loaded as a Character Card V2. Please use a Character Card V3 compatible application to use this character card properly.';

export function convertV3ToV2(v3Card: CharacterCardV3, addBackfillWarning = false): CharacterCardV2 {
  const d = v3Card.data;
  let creatorNotes = d.creator_notes || '';

  if (addBackfillWarning && !creatorNotes.includes(BACKFILL_V2_WARNING)) {
    creatorNotes = creatorNotes
      ? `${creatorNotes}\n\n${BACKFILL_V2_WARNING}`
      : BACKFILL_V2_WARNING;
  }

  const v2Card: CharacterCardV2 = {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: d.name || '',
      description: d.description || '',
      personality: d.personality || '',
      scenario: d.scenario || '',
      first_mes: d.first_mes || '',
      mes_example: d.mes_example || '',
      creator_notes: creatorNotes,
      system_prompt: d.system_prompt || '',
      post_history_instructions: d.post_history_instructions || '',
      alternate_greetings: d.alternate_greetings || [],
      character_book: d.character_book,
      tags: d.tags || [],
      creator: d.creator || '',
      character_version: d.character_version || '',
      extensions: d.extensions || {},
    },
  };

  return CharacterCardV2Schema.parse(v2Card);
}
