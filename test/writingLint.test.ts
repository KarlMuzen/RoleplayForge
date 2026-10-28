import { describe, it, expect } from 'vitest';
import { auditWritingQuality, applyWritingAutoFix } from '../src/utils/writingLint';
import type { CharacterCardV3 } from '../src/schemas/cardSchema';

describe('Zero-Cost Pre-Flight Writing Audit', () => {
  const sampleCard: CharacterCardV3 = {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name: 'Aeliana',
      description: 'Aeliana dictates user feels love. {{user}} is forced to obey Aeliana. Aeliana wants {{user}} to bow.',
      personality: 'Quiet, taciturn, uses few words.',
      scenario: 'In a medieval castle dungeon.',
      first_mes: 'Aeliana looks at {{user}} and says: "Hello, I am Aeliana."',
      mes_example: 'Aeliana: "Here is a very long monologue sentence where I speak at length despite being quiet."',
      system_prompt: '',
      tags: [],
      creator: '',
      character_version: '1.0',
      extensions: {},
      post_history_instructions: '',
      creator_notes: '',
      alternate_greetings: [],
      group_only_greetings: [],
    },
  };

  it('detects godmoding risk and hardcoded character names', () => {
    const result = auditWritingQuality(sampleCard);
    expect(result.issues.some((i) => i.category === 'Godmoding Risk')).toBe(true);
    expect(result.issues.some((i) => i.id === 'hardcoded_name_first_mes')).toBe(true);
    expect(result.score).toBeLessThan(80);
  });

  it('autofixes hardcoded name to {{char}} macro', () => {
    const issue = {
      id: 'hardcoded_name_first_mes',
      field: 'first_mes',
      severity: 'warning' as const,
      category: 'Macro Reuse' as const,
      title: 'Test',
      description: 'Test',
      recommendation: 'Test',
      autoFixAvailable: true,
      autoFixType: 'replace_name_macro' as const,
    };

    const fixedCard = applyWritingAutoFix(sampleCard, issue);
    expect(fixedCard.data.first_mes).toContain('{{char}}');
    expect(fixedCard.data.first_mes).not.toContain('Aeliana looks');
  });

  it('autofixes missing <START> tags in example dialogue', () => {
    const issue = {
      id: 'missing_start_tags_mes_ex',
      field: 'mes_example',
      severity: 'warning' as const,
      category: 'Syntax & Formatting' as const,
      title: 'Test',
      description: 'Test',
      recommendation: 'Test',
      autoFixAvailable: true,
      autoFixType: 'insert_start_tags' as const,
    };

    const fixedCard = applyWritingAutoFix(sampleCard, issue);
    expect(fixedCard.data.mes_example?.startsWith('<START>')).toBe(true);
  });

  it('autofixes paragraph formatting in long monolithic text blocks', () => {
    const issue = {
      id: 'format_paragraphs_desc',
      field: 'description',
      severity: 'info' as const,
      category: 'Syntax & Formatting' as const,
      title: 'Dense Wall of Text',
      description: 'Break paragraphs.',
      recommendation: 'Break into paragraphs.',
      autoFixAvailable: true,
      autoFixType: 'format_paragraphs' as const,
    };

    const cardWithWall: CharacterCardV3 = {
      ...sampleCard,
      data: {
        ...sampleCard.data,
        description:
          'First sentence is here. Second sentence follows. Third sentence appears. Fourth sentence begins new block. Fifth sentence continues. Sixth sentence ends block.',
      },
    };

    const fixedCard = applyWritingAutoFix(cardWithWall, issue);
    expect(fixedCard.data.description).toContain('\n\n');
  });

  it('audits clean card with high quality score', () => {
    const cleanCard: CharacterCardV3 = {
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: {
        name: 'Sir Bradley',
        description: 'A disciplined royal knight commander who has served the crown for two decades.',
        personality: 'Loyal, stoic, and speaks formally to all subjects.',
        scenario: 'Guarding the grand throne room of the capital.',
        first_mes: '*{{char}} stands at attention before {{user}}.* "Greetings. I stand ready to assist your noble endeavor."',
        mes_example: '<START>\n{{user}}: How fares the garrison?\n{{char}}: "All posts are secured, my friend. We remain vigilant."',
        system_prompt: 'Stay in character as Sir Bradley. Maintain an authentic feudal tone.',
        tags: ['fantasy', 'knight', 'royalty', 'guard'],
        creator: 'Tester',
        character_version: '1.0',
        extensions: {},
        post_history_instructions: '',
        creator_notes: '',
        alternate_greetings: [],
        group_only_greetings: [],
      },
    };

    const result = auditWritingQuality(cleanCard);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.criticalCount).toBe(0);
  });
});
