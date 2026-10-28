import type { CharacterCardV3 } from '../schemas/cardSchema';
import type { CardPatch } from '../schemas/patchSchema';

const TOP_LEVEL_FIELDS = [
  'name',
  'description',
  'personality',
  'scenario',
  'first_mes',
  'mes_example',
  'system_prompt',
  'post_history_instructions',
  'creator_notes',
] as const;

type TopLevelField = (typeof TOP_LEVEL_FIELDS)[number];

function isTopLevelField(field: string): field is TopLevelField {
  return (TOP_LEVEL_FIELDS as readonly string[]).includes(field);
}

/**
 * Pure function that applies a single CardPatch to a CharacterCardV3 object.
 * Returns a new CharacterCardV3 instance without mutating the original input.
 */
export function applyCardPatch(card: CharacterCardV3, patch: CardPatch): CharacterCardV3 {
  // Deep clone card to guarantee immutability
  const newCard: CharacterCardV3 = JSON.parse(JSON.stringify(card));

  if (patch.field === 'lorebook_entry') {
    const idx = patch.lorebookEntryIndex;
    if (idx === undefined || idx === null || typeof idx !== 'number' || idx < 0 || !Number.isInteger(idx)) {
      throw new Error(`Invalid lorebookEntryIndex "${idx}" for lorebook_entry patch.`);
    }

    const entries = newCard.data?.character_book?.entries;
    if (!entries || idx >= entries.length) {
      throw new Error(
        `Lorebook entry index ${idx} is out of bounds for character book with ${entries ? entries.length : 0} entries.`
      );
    }

    const existingContent = entries[idx].content || '';
    if (patch.action === 'replace') {
      entries[idx].content = patch.value;
    } else if (patch.action === 'append') {
      entries[idx].content = existingContent ? `${existingContent}\n${patch.value}` : patch.value;
    }

    return newCard;
  }

  if (isTopLevelField(patch.field)) {
    const fieldKey = patch.field;
    const existingValue = newCard.data[fieldKey] || '';

    if (patch.action === 'replace') {
      newCard.data[fieldKey] = patch.value;
    } else if (patch.action === 'append') {
      newCard.data[fieldKey] = existingValue ? `${existingValue}\n${patch.value}` : patch.value;
    }

    return newCard;
  }

  throw new Error(`Unsupported patch field: "${patch.field}"`);
}
