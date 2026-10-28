import type { CharacterCardV3 } from '../schemas/cardSchema';

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface WritingIssue {
  id: string;
  field: string;
  severity: IssueSeverity;
  category:
    | 'Godmoding Risk'
    | 'Prose Density'
    | 'Greeting Hook'
    | 'Dialogue Mismatch'
    | 'Macro Reuse'
    | 'Syntax & Formatting'
    | 'Token Efficiency'
    | 'Model Compatibility'
    | 'Internal Consistency';
  title: string;
  description: string;
  recommendation: string;
  snippet?: string;
  autoFixAvailable?: boolean;
  autoFixType?: 'replace_name_macro' | 'insert_start_tags' | 'format_paragraphs' | 'remove_redundancies';
}

export interface PreFlightLintResult {
  score: number; // 0-100 quality score
  status: 'excellent' | 'good' | 'needs_work' | 'critical';
  issues: WritingIssue[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  tokenSavingsEstimate: number;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function checkHardcodedName(name: string, firstMes: string, mesEx: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  if (!name || name.length < 3) return issues;
  const nameRegex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'gi');

  const mesNameMatches = (firstMes.match(nameRegex) || []).length;
  if (mesNameMatches > 0) {
    issues.push({
      id: 'hardcoded_name_first_mes',
      field: 'first_mes',
      severity: 'warning',
      category: 'Macro Reuse',
      title: `Hardcoded Character Name in First Message (${mesNameMatches}x)`,
      description: `The character's exact name "${name}" is hardcoded in the First Message instead of using {{char}}.`,
      recommendation: `Replace "${name}" with {{char}} to allow instant card renaming and macro consistency across frontends.`,
      snippet: firstMes.slice(0, 120) + '...',
      autoFixAvailable: true,
      autoFixType: 'replace_name_macro',
    });
  }

  const exNameMatches = (mesEx.match(nameRegex) || []).length;
  if (exNameMatches > 0) {
    issues.push({
      id: 'hardcoded_name_mes_ex',
      field: 'mes_example',
      severity: 'warning',
      category: 'Macro Reuse',
      title: `Hardcoded Character Name in Example Dialogue (${exNameMatches}x)`,
      description: `The character's name "${name}" is hardcoded in Example Dialogue instead of using {{char}}.`,
      recommendation: `Replace "${name}" with {{char}} in example dialogue blocks for proper macro substitution.`,
      snippet: mesEx.slice(0, 120) + '...',
      autoFixAvailable: true,
      autoFixType: 'replace_name_macro',
    });
  }

  return issues;
}

function checkGodmodingRisk(desc: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const userMacroCount = (desc.match(/\{\{user\}\}/gi) || []).length;
  const userWordCount = (desc.match(/\buser\b/gi) || []).length;
  const totalUserMentions = userMacroCount + userWordCount;

  if (totalUserMentions >= 3) {
    const DictatesActionsRegex = /\b(user\s+(is|feels|thinks|wants|falls|loves|obeys|becomes|is\s+forced|acts|sees))\b/gi;
    const dictatesMatches = desc.match(DictatesActionsRegex);

    issues.push({
      id: 'godmoding_risk_desc',
      field: 'description',
      severity: dictatesMatches ? 'critical' : 'warning',
      category: 'Godmoding Risk',
      title: dictatesMatches
        ? 'Critical Godmoding Risk in Description'
        : 'Over-reliance on {{user}} in Description',
      description: dictatesMatches
        ? `Description dictates user actions/feelings ("${dictatesMatches[0]}"), which causes models to control the user's character during roleplay.`
        : `Description mentions {{user}} ${totalUserMentions} times. Over-indexing on the user in character definition leads to prompt bleeding and user hijacking.`,
      recommendation:
        'Focus description on {{char}}\'s intrinsic motivations, background, physical traits, and behaviors rather than dictating how {{user}} reacts.',
      snippet: desc.slice(0, 150) + '...',
    });
  }

  return issues;
}

function checkSingleProseWall(text: string, fieldName: string, label: string): WritingIssue | null {
  if (!text) return null;
  const paragraphs = text.split(/\n\s*\n/);
  for (const p of paragraphs) {
    if (p.trim().length > 450 && !p.includes('"') && !p.includes('*')) {
      return {
        id: `wall_of_prose_${fieldName}`,
        field: fieldName,
        severity: 'warning',
        category: 'Prose Density',
        title: `Wall of Undifferentiated Prose in ${label}`,
        description: `Contains a dense text block (${p.trim().length} chars) without paragraph breaks, dialogue quotes, or formatting.`,
        recommendation: 'Break long narrative blocks into shorter paragraphs (2-3 sentences) with clear formatting for better LLM comprehension.',
        snippet: p.trim().slice(0, 140) + '...',
        autoFixAvailable: true,
        autoFixType: 'format_paragraphs',
      };
    }
  }
  return null;
}

function checkProseWalls(desc: string, firstMes: string, scen: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const descWall = checkSingleProseWall(desc, 'description', 'Description');
  if (descWall) issues.push(descWall);
  const firstMesWall = checkSingleProseWall(firstMes, 'first_mes', 'First Message');
  if (firstMesWall) issues.push(firstMesWall);
  const scenWall = checkSingleProseWall(scen, 'scenario', 'Scenario');
  if (scenWall) issues.push(scenWall);
  return issues;
}

function checkGreetingQuality(firstMes: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  if (!firstMes) return issues;

  const wordCount = firstMes.trim().split(/\s+/).length;
  if (wordCount < 20) {
    issues.push({
      id: 'weak_greeting_short',
      field: 'first_mes',
      severity: 'warning',
      category: 'Greeting Hook',
      title: 'Very Short Opening Greeting',
      description: `First Message is only ${wordCount} words long. Short greetings give LLMs very little stylistic momentum or scenario context to build upon.`,
      recommendation: 'Expand the First Message to include sensory details, initial actions (*actions*), and open narrative hooks.',
      snippet: firstMes,
    });
  }

  const GenericStarters = /^(hello|hi|hey|greetings|welcome)[,\!\.\s]+(i\s+am|my\s+name\s+is|it['’]s\s+a\s+pleasure)/i;
  if (GenericStarters.test(firstMes.trim())) {
    issues.push({
      id: 'generic_greeting_starter',
      field: 'first_mes',
      severity: 'info',
      category: 'Greeting Hook',
      title: 'Generic Greeting Starter Detected',
      description: 'First Message begins with a generic verbal intro ("Hello, I am..."), which often produces flat AI responses.',
      recommendation: 'Start in media res with active narration, environmental description, or distinctive action.',
      snippet: firstMes.slice(0, 100),
    });
  }

  const hasQuotes = firstMes.includes('"') || firstMes.includes('“') || firstMes.includes('”');
  const hasAsterisks = firstMes.includes('*');
  if (!hasQuotes && !hasAsterisks && wordCount > 25) {
    issues.push({
      id: 'unformatted_greeting',
      field: 'first_mes',
      severity: 'info',
      category: 'Syntax & Formatting',
      title: 'Unformatted First Message',
      description: 'First Message does not use standard roleplay formatting (*asterisks* for actions, "quotes" for speech).',
      recommendation: 'Use *asterisks for actions* and "quotes for spoken dialogue" to guide the model\'s output formatting.',
    });
  }

  return issues;
}

function checkExampleDialogue(mesEx: string, pers: string, desc: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  if (!mesEx) return issues;

  const hasStartTag = mesEx.includes('<START>') || mesEx.includes('<start>');
  if (!hasStartTag) {
    issues.push({
      id: 'missing_start_tags_mes_ex',
      field: 'mes_example',
      severity: 'warning',
      category: 'Syntax & Formatting',
      title: 'Missing <START> Tags in Example Dialogue',
      description: 'Example Dialogue lacks <START> block tags separating sample turns.',
      recommendation: 'Separate sample conversations using <START> tags so the model recognizes individual dialogue examples.',
      snippet: mesEx.slice(0, 120),
      autoFixAvailable: true,
      autoFixType: 'insert_start_tags',
    });
  }

  const TaciturnRegex = /\b(taciturn|quiet|silent|terse|laconic|uses\s+few\s+words|speaks\s+rarely|short\s+answers)\b/i;
  if (TaciturnRegex.test(pers) || TaciturnRegex.test(desc)) {
    const speechTurns = mesEx.match(/\{\{char\}\}:\s*"([^"]+)"/gi) || [];
    const longSpeech = speechTurns.some((t) => t.split(/\s+/).length > 60);
    if (longSpeech) {
      issues.push({
        id: 'contradiction_taciturn_long_dialogue',
        field: 'mes_example',
        severity: 'warning',
        category: 'Dialogue Mismatch',
        title: 'Personality vs. Dialogue Contradiction (Taciturn)',
        description: 'Personality defines {{char}} as quiet/taciturn, but Example Dialogue contains lengthy multi-sentence speeches.',
        recommendation: 'Shorten {{char}}\'s dialogue turns in Example Dialogue to reflect their concise, taciturn speaking style.',
      });
    }
  }

  const FormalRegex = /\b(formal|archaic|noble|royal|distinguished|eloquent|polite|courtly)\b/i;
  const SlangRegex = /\b(gonna|wanna|yeah|nah|idk|lol|omg|sup|dunno|gotta)\b/i;
  if ((FormalRegex.test(pers) || FormalRegex.test(desc)) && SlangRegex.test(mesEx)) {
    const slangMatch = mesEx.match(SlangRegex);
    issues.push({
      id: 'contradiction_formal_slang',
      field: 'mes_example',
      severity: 'warning',
      category: 'Dialogue Mismatch',
      title: 'Formal Tone vs. Casual Slang Contradiction',
      description: `Personality defines a formal/noble tone, but Example Dialogue uses casual slang ("${slangMatch?.[0]}").`,
      recommendation: 'Clean slang and informal contractions out of Example Dialogue to preserve formal speech patterns.',
    });
  }

  return issues;
}

function checkRedundantSentences(desc: string, pers: string): { issues: WritingIssue[]; tokenSavings: number } {
  const issues: WritingIssue[] = [];
  let tokenSavings = 0;

  if (desc.length > 100 && pers.length > 100) {
    const descSentences = desc.split(/[\.\!\?]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 25);
    const persSentences = pers.split(/[\.\!\?]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 25);

    let dupCount = 0;
    descSentences.forEach((ds) => {
      if (persSentences.some((ps) => ps === ds || ps.includes(ds) || ds.includes(ps))) {
        dupCount++;
      }
    });

    if (dupCount >= 2) {
      tokenSavings = dupCount * 25;
      issues.push({
        id: 'redundant_sentences_desc_pers',
        field: 'personality',
        severity: 'info',
        category: 'Token Efficiency',
        title: `Redundant Sentences Across Fields (${dupCount}x)`,
        description: `Identified ${dupCount} repeated or near-identical sentences across Description and Personality fields.`,
        recommendation: 'Remove redundant sentences to save context tokens and eliminate prompt bloat.',
      });
    }
  }

  return { issues, tokenSavings };
}

function checkBracketMatching(desc: string, pers: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const openBrackets = (desc.match(/\[/g) || []).length + (pers.match(/\[/g) || []).length;
  const closeBrackets = (desc.match(/\]/g) || []).length + (pers.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    issues.push({
      id: 'unmatched_brackets',
      field: 'description',
      severity: 'warning',
      category: 'Syntax & Formatting',
      title: 'Unmatched W++ / Attribute Brackets',
      description: `Found ${openBrackets} opening '[' and ${closeBrackets} closing ']' brackets across description fields.`,
      recommendation: 'Ensure all W++ attribute syntax brackets [Trait("value")] are properly closed.',
    });
  }
  return issues;
}

function checkModelCompatibility(sysPrompt: string, postHist: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const combinedPrompts = `${sysPrompt} ${postHist}`;
  const restrictionBypassRegex = /(ignore\s+(all\s+)?(content\s+)?(restrictions|filters|guidelines|policies|rules|safeguards|warnings)|do\s+not\s+refuse|never\s+refuse|bypass\s+(the\s+)?filter|uncensored\s+mode|jailbreak|disregard\s+(all\s+)?safety|disable\s+(all\s+)?(censorship|filters))/i;
  if (restrictionBypassRegex.test(combinedPrompts)) {
    issues.push({
      id: 'model_compatibility_prompt_hint',
      field: 'system_prompt',
      severity: 'info',
      category: 'Model Compatibility',
      title: 'Model Compatibility Notice (Unrestricted Prompting)',
      description: 'System prompt contains explicit instructions to ignore content restrictions or disable refusal behavior.',
      recommendation: 'Mainstream provider APIs (e.g. OpenAI, Anthropic, Gemini) frequently moderate or refuse prompts with explicit bypass instructions. For optimal stability, route this card through a roleplay-tuned or uncensored model (e.g. Dolphin, Hermes, Mythomax) via OpenRouter or Ollama.',
      snippet: combinedPrompts.slice(0, 150) + (combinedPrompts.length > 150 ? '...' : ''),
    });
  }
  return issues;
}

function calculateQualityScore(issues: WritingIssue[]): {
  score: number;
  status: PreFlightLintResult['status'];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
} {
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  let score = 100 - criticalCount * 25 - warningCount * 10 - infoCount * 3;
  score = Math.max(0, Math.min(100, score));

  let status: PreFlightLintResult['status'] = 'excellent';
  if (score < 50 || criticalCount > 0) {
    status = 'critical';
  } else if (score < 75) {
    status = 'needs_work';
  } else if (score < 90) {
    status = 'good';
  }

  return { score, status, criticalCount, warningCount, infoCount };
}

/**
  Performs an instant, zero-cost, offline pre-flight audit of character writing quality and roleplay heuristics.
  Requires zero API calls or tokens.
 */
export function auditWritingQuality(card: CharacterCardV3 | null): PreFlightLintResult {
  if (!card || !card.data) {
    return {
      score: 0,
      status: 'critical',
      issues: [
        {
          id: 'no_card',
          field: 'global',
          severity: 'critical',
          category: 'Syntax & Formatting',
          title: 'No Active Character Card',
          description: 'No character card data loaded in the editor.',
          recommendation: 'Load or create a character card before running pre-flight linting.',
        },
      ],
      criticalCount: 1,
      warningCount: 0,
      infoCount: 0,
      tokenSavingsEstimate: 0,
    };
  }

  const d = card.data;
  const name = d.name?.trim() || '';
  const desc = d.description || '';
  const pers = d.personality || '';
  const scen = d.scenario || '';
  const firstMes = d.first_mes || '';
  const mesEx = d.mes_example || '';
  const sysPrompt = d.system_prompt || '';
  const postHist = d.post_history_instructions || '';

  const issues: WritingIssue[] = [];

  // 1. HARDCODED CHARACTER NAME INSTEAD OF {{char}} MACRO
  issues.push(...checkHardcodedName(name, firstMes, mesEx));

  // 2. GODMODING RISK / OVER-RELIANCE ON {{user}} IN DESCRIPTION
  issues.push(...checkGodmodingRisk(desc));

  // 3. WALLS OF UNDIFFERENTIATED PROSE
  issues.push(...checkProseWalls(desc, firstMes, scen));

  // 4. GENERIC OR WEAK GREETING (first_mes)
  issues.push(...checkGreetingQuality(firstMes));

  // 5. EXAMPLE DIALOGUE (mes_example) ISSUES & CONTRADICTIONS
  issues.push(...checkExampleDialogue(mesEx, pers, desc));

  // 6. REDUNDANT TEXT BLOAT ACROSS FIELDS
  const redundancy = checkRedundantSentences(desc, pers);
  issues.push(...redundancy.issues);
  const tokenSavingsEstimate = redundancy.tokenSavings;

  // 7. UNCLOSED BRACKETS / MIXED W++ SYNTAX
  issues.push(...checkBracketMatching(desc, pers));

  // 8. MODEL COMPATIBILITY: UNRESTRICTED / ANTI-REFUSAL PROMPTS
  issues.push(...checkModelCompatibility(sysPrompt, postHist));

  // CALCULATE OVERALL QUALITY SCORE
  const { score, status, criticalCount, warningCount, infoCount } = calculateQualityScore(issues);

  return {
    score,
    status,
    issues,
    criticalCount,
    warningCount,
    infoCount,
    tokenSavingsEstimate,
  };
}

function formatParagraphText(val?: string): string {
  if (!val) return '';
  return val
    .split(/(?<=[.!?])\s+(?=[A-Z0-9*"])/)
    .reduce((acc, sentence, idx) => {
      if (idx > 0 && idx % 3 === 0) {
        return `${acc}\n\n${sentence}`;
      }
      return `${acc} ${sentence}`;
    }, '')
    .trim();
}

function applyNameMacroFix(d: CharacterCardV3['data'], issue: WritingIssue, name: string): void {
  if (!name) return;
  const nameRegex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'gi');
  if (issue.field === 'first_mes' && d.first_mes) {
    d.first_mes = d.first_mes.replace(nameRegex, '{{char}}');
  } else if (issue.field === 'mes_example' && d.mes_example) {
    d.mes_example = d.mes_example.replace(nameRegex, '{{char}}');
  }
}

function applyStartTagsFix(d: CharacterCardV3['data']): void {
  if (!d.mes_example) return;
  const raw = d.mes_example.trim();
  if (!raw.startsWith('<START>')) {
    d.mes_example = `<START>\n${raw}`;
  }
}

function applyParagraphFormattingFix(d: CharacterCardV3['data'], issue: WritingIssue): void {
  if (issue.field === 'description' && d.description) d.description = formatParagraphText(d.description);
  if (issue.field === 'first_mes' && d.first_mes) d.first_mes = formatParagraphText(d.first_mes);
  if (issue.field === 'scenario' && d.scenario) d.scenario = formatParagraphText(d.scenario);
}

/**
  Applies an automated fix for a specific writing issue.
 */
export function applyWritingAutoFix(
  card: CharacterCardV3,
  issue: WritingIssue
): CharacterCardV3 {
  const updated = JSON.parse(JSON.stringify(card)) as CharacterCardV3;
  const d = updated.data;
  const name = d.name?.trim() || '';

  if (issue.autoFixType === 'replace_name_macro') {
    applyNameMacroFix(d, issue, name);
  } else if (issue.autoFixType === 'insert_start_tags') {
    applyStartTagsFix(d);
  } else if (issue.autoFixType === 'format_paragraphs') {
    applyParagraphFormattingFix(d, issue);
  }

  return updated;
}

