import type { CharacterCardV3 } from '../schemas/cardSchema';
import type { StoredCard } from '../db';

export type DuplicateMatchKind = 'identical' | 'modified';

export interface DuplicateMatch {
  existing: StoredCard;
  kind: DuplicateMatchKind;
}

function getSubstantiveContent(card: CharacterCardV3): string {
  const d = card.data;
  return JSON.stringify({
    name: d.name,
    description: d.description,
    personality: d.personality,
    scenario: d.scenario,
    first_mes: d.first_mes,
    mes_example: d.mes_example,
    system_prompt: d.system_prompt,
    post_history_instructions: d.post_history_instructions,
    alternate_greetings: d.alternate_greetings,
  });
}

/**
 * Looks for an existing card that shares a (case-insensitive) name + creator
 * with the incoming card. If found, also reports whether the content is
 * byte-for-byte identical or has diverged, so the UI can pick a sensible
 * default action.
 */
export function findDuplicateCard(
  existingCards: StoredCard[],
  incoming: CharacterCardV3
): DuplicateMatch | undefined {
  const name = (incoming.data.name || '').trim().toLowerCase();
  if (!name) return undefined;
  const creator = (incoming.data.creator || '').trim().toLowerCase();

  const existing = existingCards.find(
    (c) =>
      (c.name || '').trim().toLowerCase() === name &&
      (c.creator || '').trim().toLowerCase() === creator
  );

  if (!existing) return undefined;

  const isIdentical = getSubstantiveContent(incoming) === getSubstantiveContent(existing.cardData);

  return {
    existing,
    kind: isIdentical ? 'identical' : 'modified',
  };
}
