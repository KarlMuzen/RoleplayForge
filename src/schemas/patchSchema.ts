import { z } from 'zod';

export const patchItemSchema = z.object({
  field: z.enum([
    'name',
    'description',
    'personality',
    'scenario',
    'first_mes',
    'mes_example',
    'system_prompt',
    'post_history_instructions',
    'creator_notes',
    'lorebook_entry',
  ]),
  action: z.enum(['replace', 'append']),
  value: z.string(),
  lorebookEntryIndex: z.number().optional(),
  rationale: z.string(),
});

export const cardPatchSchema = z.object({
  patches: z.array(patchItemSchema),
});

export type CardPatch = z.infer<typeof patchItemSchema>;
export type CardPatchGroup = z.infer<typeof cardPatchSchema>;

export const cardPatchJsonSchema = {
  type: 'object',
  properties: {
    patches: {
      type: 'array',
      description: 'List of field updates/patches to apply to the character card',
      items: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            description:
              "Field to update: 'name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example', 'system_prompt', 'post_history_instructions', 'creator_notes', or 'lorebook_entry'",
          },
          action: {
            type: 'string',
            description: "Action to take: 'replace' or 'append'",
          },
          value: {
            type: 'string',
            description: 'The string content to replace with or append',
          },
          lorebookEntryIndex: {
            type: 'number',
            description: "0-based index of the lorebook entry when field is 'lorebook_entry'",
          },
          rationale: {
            type: 'string',
            description: 'Short human-readable reason explaining this proposed change',
          },
        },
        required: ['field', 'action', 'value', 'rationale'],
      },
    },
  },
  required: ['patches'],
};
