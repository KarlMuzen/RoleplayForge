import type { LorebookEntry } from '../schemas/cardSchema';

export interface ParsedDecorator {
  name: string;
  args: string[];
  isFallback: boolean;
  rawLine: string;
}

export interface ProcessedLorebookEntry {
  original: LorebookEntry;
  cleanContent: string;
  decorators: ParsedDecorator[];
}

/**
 * Extracts @@decorators and @@@fallbacks from entry content.
 */
export function extractDecorators(content: string): { cleanContent: string; decorators: ParsedDecorator[] } {
  if (!content) return { cleanContent: '', decorators: [] };

  const lines = content.split(/\r?\n/);
  const decorators: ParsedDecorator[] = [];
  const remainingLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@@')) {
      const isFallback = trimmed.startsWith('@@@');
      const rawNameAndArgs = isFallback ? trimmed.slice(3) : trimmed.slice(2);
      const parts = rawNameAndArgs.split(/\s+/);
      const name = parts[0] || '';
      const argsStr = parts.slice(1).join(' ');
      const args = argsStr ? argsStr.split(',').map((a) => a.trim()) : [];

      decorators.push({
        name: name.toLowerCase(),
        args,
        isFallback,
        rawLine: line,
      });
    } else {
      remainingLines.push(line);
    }
  }

  return {
    cleanContent: remainingLines.join('\n').trim(),
    decorators,
  };
}

const MAX_DEPTH = 10;
const INNER_MACRO_REGEX = /\{\{([^{}]*(?:(?:\{(?!\{)|\}(?!\}))[^{}]*)*)\}\}/g;

/**
 * Resolves CBS (Curly Braced Syntaxes / Macros) in a string for preview or generation.
 */
export function resolveMacros(
  text: string,
  context: { charName: string; userName: string; activeGreetingIndex?: number }
): string {
  if (!text) return '';

  const charName = context.charName || 'Character';
  const userName = context.userName || 'User';

  // Static non-braced replacements first
  let result = text
    .replace(/<char>/gi, charName)
    .replace(/<bot>/gi, charName)
    .replace(/<user>/gi, userName);

  let iterations = 0;
  let previous = '';

  while (result !== previous && iterations < MAX_DEPTH) {
    previous = result;
    result = result.replace(INNER_MACRO_REGEX, (match, inner) => {
      const evaluated = evaluateMacro(inner, { charName, userName });
      return evaluated === undefined ? match : evaluated;
    });
    iterations++;
  }

  return result;
}

function evaluateMacro(inner: string, context: { charName: string; userName: string }): string | undefined {
  const lower = inner.trim().toLowerCase();

  if (lower === 'char') return context.charName;
  if (lower === 'user') return context.userName;

  // comments
  if (lower.startsWith('//') || lower.startsWith('comment:')) return '';

  // random / pick
  if (lower.startsWith('random:') || lower.startsWith('pick:')) {
    const colonIdx = inner.indexOf(':');
    const optionsStr = inner.substring(colonIdx + 1);
    const options = splitByComma(optionsStr);
    
    if (options.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex] || '';
  }

  // roll
  if (lower.startsWith('roll:')) {
    const colonIdx = inner.indexOf(':');
    let nStr = inner.substring(colonIdx + 1).trim();
    if (nStr.toLowerCase().startsWith('d')) {
      nStr = nStr.substring(1);
    }
    const max = parseInt(nStr, 10);
    if (isNaN(max) || max <= 0) return '1';
    return (Math.floor(Math.random() * max) + 1).toString();
  }

  // reverse
  if (lower.startsWith('reverse:')) {
    const colonIdx = inner.indexOf(':');
    const strToRev = inner.substring(colonIdx + 1);
    return strToRev.split('').reverse().join('');
  }

  return undefined; // Unknown macro
}

// split by comma but respect escaped commas \,
function splitByComma(str: string): string[] {
  const parts: string[] = [];
  let current = '';
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\' && str[i + 1] === ',') {
      current += ',';
      i++; // skip escaped comma
    } else if (str[i] === ',') {
      parts.push(current.trim());
      current = '';
    } else {
      current += str[i];
    }
  }
  parts.push(current.trim());
  return parts;
}
