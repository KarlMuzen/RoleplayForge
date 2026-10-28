import type { CharacterCardV3 } from '../schemas/cardSchema';

export function createNewDefaultCard(name = 'New Character'): CharacterCardV3 {
  const now = Math.floor(Date.now() / 1000);
  return {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name,
      description: '',
      tags: [],
      creator: '',
      character_version: '1.0.0',
      mes_example: '',
      extensions: {},
      system_prompt: '',
      post_history_instructions: '',
      first_mes: '',
      alternate_greetings: [],
      personality: '',
      scenario: '',
      creator_notes: '',
      group_only_greetings: [],
      creation_date: now,
      modification_date: now,
      assets: [
        {
          type: 'icon',
          uri: 'ccdefault:',
          name: 'main',
          ext: 'png',
        },
      ],
      character_book: {
        name: `${name} Lorebook`,
        description: '',
        scan_depth: 5,
        token_budget: 1000,
        recursive_scanning: true,
        extensions: {},
        entries: [],
      },
    },
  };
}
