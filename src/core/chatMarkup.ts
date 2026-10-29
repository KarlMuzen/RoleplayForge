export type ChatToken = {
  type: 'text' | 'italic' | 'bold' | 'strike' | 'code';
  text: string;
  children?: ChatToken[];
};

type FormattedType = Exclude<ChatToken['type'], 'text'>;

type Marker = {
  delimiter: string;
  type: FormattedType;
};

type ParseResult = {
  tokens: ChatToken[];
  index: number;
  closed: boolean;
};

const MAX_NESTING_DEPTH = 3;

function isSpace(character: string | undefined): boolean {
  return character !== undefined && /\s/.test(character);
}

function trimInnerSpaces(value: string): string {
  return value.replace(/^[ \t]+|[ \t]+$/g, '');
}

/**
 * Fix only spaces immediately inside paired asterisk markers on display text.
 * Fenced code is copied byte-for-byte, including its delimiter lines.
 */
export function fixChatMarkup(text: string): string {
  let inFence = false;

  return text
    .split('\n')
    .map((line) => {
      if (line.startsWith('```')) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;

      const boldFixed = line.replace(/\*\*([^\n]*?)\*\*/g, (_match, inner: string) => {
        return `**${trimInnerSpaces(inner)}**`;
      });

      return boldFixed.replace(/(^|[^*])\*([^*\n]*?)\*(?!\*)/g, (_match, prefix: string, inner: string) => {
        return `${prefix}*${trimInnerSpaces(inner)}*`;
      });
    })
    .join('\n');
}

function markerAt(line: string, index: number): Marker | undefined {
  if (line.startsWith('**', index)) return { delimiter: '**', type: 'bold' };
  if (line.startsWith('~~', index)) return { delimiter: '~~', type: 'strike' };
  if (line[index] === '*') return { delimiter: '*', type: 'italic' };
  if (line[index] === '`') return { delimiter: '`', type: 'code' };
  return undefined;
}

function canOpen(line: string, index: number, marker: Marker): boolean {
  const nextIndex = index + marker.delimiter.length;
  return nextIndex < line.length && !isSpace(line[nextIndex]);
}

function isClosingMarker(line: string, index: number, marker: Marker): boolean {
  if (!line.startsWith(marker.delimiter, index)) return false;
  if (index === 0 || isSpace(line[index - 1])) return false;

  // A double-star marker is not a single-star close, except when a triple-star
  // run closes nested italic and then bold (e.g. **bold *and italic***).
  if (
    marker.delimiter === '*' &&
    line[index + 1] === '*' &&
    line[index + 2] !== '*'
  ) {
    return false;
  }

  return true;
}

function appendText(tokens: ChatToken[], text: string): void {
  if (!text) return;
  const last = tokens[tokens.length - 1];
  if (last?.type === 'text') {
    last.text += text;
  } else {
    tokens.push({ type: 'text', text });
  }
}

function containsFormatting(tokens: ChatToken[]): boolean {
  return tokens.some((token) => token.type !== 'text' || token.children !== undefined);
}

function hasVisibleContent(text: string): boolean {
  return text.replace(/[\*~`]/g, '').trim().length > 0;
}

function makeFormattedToken(
  type: FormattedType,
  text: string,
  children: ChatToken[],
): ChatToken {
  if (containsFormatting(children)) {
    return { type, text, children };
  }
  return { type, text };
}

function findCodeClose(line: string, start: number): number {
  for (let index = start + 1; index < line.length; index += 1) {
    if (line[index] === '`' && !isSpace(line[index - 1])) {
      return index;
    }
  }
  return -1;
}

function parseSegment(
  line: string,
  start: number,
  stopMarker: Marker | undefined,
  depth: number,
): ParseResult {
  const tokens: ChatToken[] = [];
  let index = start;

  while (index < line.length) {
    if (stopMarker && isClosingMarker(line, index, stopMarker)) {
      return { tokens, index, closed: true };
    }

    // Fenced code blocks are not a markup feature of this parser.
    if (line.startsWith('```', index)) {
      appendText(tokens, '```');
      index += 3;
      continue;
    }

    const marker = markerAt(line, index);
    if (marker && depth < MAX_NESTING_DEPTH && canOpen(line, index, marker)) {
      const contentStart = index + marker.delimiter.length;

      if (marker.type === 'code') {
        if (line[contentStart] === '`') {
          appendText(tokens, '``');
          index = contentStart + 1;
          continue;
        }
        const closingIndex = findCodeClose(line, contentStart);
        if (closingIndex >= 0) {
          const codeText = line.slice(contentStart, closingIndex);
          if (codeText.length > 0) {
            tokens.push({ type: 'code', text: codeText });
            index = closingIndex + 1;
          } else {
            appendText(tokens, '``');
            index = closingIndex + 1;
          }
        } else {
          const codeText = line.slice(contentStart);
          if (codeText.length > 0) {
            tokens.push({ type: 'code', text: codeText });
          } else {
            appendText(tokens, marker.delimiter);
          }
          index = line.length;
        }
        continue;
      }

      const nested = parseSegment(line, contentStart, marker, depth + 1);
      if (nested.closed) {
        const innerText = line.slice(contentStart, nested.index);
        if (innerText.length > 0) {
          tokens.push(makeFormattedToken(marker.type, innerText, nested.tokens));
          index = nested.index + marker.delimiter.length;
        } else {
          // Empty pairs are not formatting. Keep the opening marker literal and
          // let the would-be close be processed as ordinary text on the next pass.
          appendText(tokens, marker.delimiter);
          index = contentStart;
        }
      } else {
        // An opening marker without a valid same-line close implicitly closes
        // at the line ending. Nested formatting already parsed to the same edge.
        const innerText = line.slice(contentStart);
        if (innerText.length > 0) {
          tokens.push(makeFormattedToken(marker.type, innerText, nested.tokens));
        } else {
          appendText(tokens, marker.delimiter);
        }
        index = line.length;
      }
      continue;
    }

    if (
      !stopMarker &&
      marker &&
      index + marker.delimiter.length === line.length &&
      index > 0 &&
      !isSpace(line[index - 1]) &&
      hasVisibleContent(line.slice(0, index))
    ) {
      // A terminal unmatched closer wraps the line's preceding text.
      const textBeforeMarker = line.slice(0, index);
      const previousTokens = containsFormatting(tokens) ? tokens : undefined;
      tokens.length = 0;
      if (marker.type === 'code') {
        tokens.push({ type: 'code', text: textBeforeMarker });
      } else if (previousTokens) {
        tokens.push({ type: marker.type, text: textBeforeMarker, children: previousTokens });
      } else {
        tokens.push({ type: marker.type, text: textBeforeMarker });
      }
      return { tokens, index: line.length, closed: false };
    }

    if (marker) {
      appendText(tokens, marker.delimiter);
      index += marker.delimiter.length;
    } else {
      appendText(tokens, line[index]);
      index += 1;
    }
  }

  return { tokens, index: line.length, closed: false };
}

/**
 * Parse the small, display-only markup subset used in chat bubbles.
 * Each line is parsed independently; newline tokens preserve line boundaries.
 */
export function parseChatMarkup(text: string): ChatToken[] {
  if (text.length === 0) return [];

  const lines = text.split('\n');
  const tokens: ChatToken[] = [];

  lines.forEach((line, lineIndex) => {
    const result = parseSegment(line, 0, undefined, 0);
    tokens.push(...result.tokens);
    if (lineIndex < lines.length - 1) {
      tokens.push({ type: 'text', text: '\n' });
    }
  });

  return tokens;
}
