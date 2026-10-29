import { describe, expect, it } from 'vitest';
import { fixChatMarkup, parseChatMarkup, type ChatToken } from '../src/core/chatMarkup';

function tokenShape(tokens: ChatToken[]): Array<{ type: ChatToken['type']; text: string }> {
  return tokens.map(({ type, text }) => ({ type, text }));
}

function parseDisplayText(text: string): ChatToken[] {
  return parseChatMarkup(fixChatMarkup(text));
}

describe('parseChatMarkup', () => {
  it('formats single-star actions and preserves trailing text', () => {
    expect(tokenShape(parseDisplayText('*waves* hello'))).toEqual([
      { type: 'italic', text: 'waves' },
      { type: 'text', text: ' hello' },
    ]);
  });

  it('formats double-star bold text', () => {
    expect(tokenShape(parseDisplayText('**bold**'))).toEqual([
      { type: 'bold', text: 'bold' },
    ]);
  });

  it('fixes spaces just inside asterisk pairs before parsing', () => {
    expect(tokenShape(parseDisplayText('* spaced *'))).toEqual([
      { type: 'italic', text: 'spaced' },
    ]);
  });

  it('implicitly closes an unmatched opening marker at the line ending', () => {
    expect(tokenShape(parseDisplayText('She says *hello'))).toEqual([
      { type: 'text', text: 'She says ' },
      { type: 'italic', text: 'hello' },
    ]);
  });

  it('implicitly opens a span at the start for a terminal unmatched closer', () => {
    expect(tokenShape(parseDisplayText('close*'))).toEqual([
      { type: 'italic', text: 'close' },
    ]);
  });

  it('leaves a marker that is neither a valid opener nor closer as plain text', () => {
    expect(tokenShape(parseDisplayText('a * b'))).toEqual([
      { type: 'text', text: 'a * b' },
    ]);
  });

  it('handles the unmatched bold greeting shape without emitting stray asterisks', () => {
    const tokens = parseDisplayText('**Use V2 Spec. (Menu > Configuration)');
    expect(tokenShape(tokens)).toEqual([
      { type: 'bold', text: 'Use V2 Spec. (Menu > Configuration)' },
    ]);
    expect(tokens.map(({ text }) => text).join('')).not.toContain('*');
  });

  it('parses each line independently and preserves newline tokens', () => {
    expect(tokenShape(parseDisplayText('*a*\n*b*'))).toEqual([
      { type: 'italic', text: 'a' },
      { type: 'text', text: '\n' },
      { type: 'italic', text: 'b' },
    ]);
  });

  it('implicitly closes opening and closing actions on separate lines', () => {
    expect(tokenShape(parseDisplayText('*open\nclose*'))).toEqual([
      { type: 'italic', text: 'open' },
      { type: 'text', text: '\n' },
      { type: 'italic', text: 'close' },
    ]);
  });

  it('does not parse markers inside inline code', () => {
    expect(tokenShape(parseDisplayText('`*not italic*`'))).toEqual([
      { type: 'code', text: '*not italic*' },
    ]);
  });

  it('does not format empty inline-code pairs', () => {
    expect(tokenShape(parseDisplayText('``'))).toEqual([
      { type: 'text', text: '``' },
    ]);
  });

  it('formats strikethrough', () => {
    expect(tokenShape(parseDisplayText('~~gone~~'))).toEqual([
      { type: 'strike', text: 'gone' },
    ]);
  });

  it('supports italic nested inside bold with a triple-star close', () => {
    const tokens = parseDisplayText('**bold *and italic***');
    expect(tokenShape(tokens)).toEqual([
      { type: 'bold', text: 'bold *and italic*' },
    ]);
    expect(tokens[0].children).toEqual([
      { type: 'text', text: 'bold ' },
      { type: 'italic', text: 'and italic' },
    ]);
  });

  it('supports bold nested inside italic', () => {
    const tokens = parseDisplayText('*an **ugly** case*');
    expect(tokenShape(tokens)).toEqual([
      { type: 'italic', text: 'an **ugly** case' },
    ]);
    expect(tokens[0].children).toEqual([
      { type: 'text', text: 'an ' },
      { type: 'bold', text: 'ugly' },
      { type: 'text', text: ' case' },
    ]);
  });

  it('leaves formatting beyond three nesting levels literal', () => {
    const tokens = parseDisplayText('*one **two ~~three *four*~~** end*');
    expect(tokens[0].type).toBe('italic');
    expect(tokens[0].children).toEqual([
      { type: 'text', text: 'one ' },
      {
        type: 'bold',
        text: 'two ~~three *four*~~',
        children: [
          { type: 'text', text: 'two ' },
          { type: 'strike', text: 'three *four*' },
        ],
      },
      { type: 'text', text: ' end' },
    ]);
  });

  it('does not treat underscores as formatting markers', () => {
    for (const input of ['snake_case_word', 'a_b_c']) {
      expect(tokenShape(parseDisplayText(input))).toEqual([
        { type: 'text', text: input },
      ]);
    }
  });

  it('keeps HTML-like text literal', () => {
    expect(tokenShape(parseDisplayText('<b>x</b>'))).toEqual([
      { type: 'text', text: '<b>x</b>' },
    ]);
  });

  it('returns no tokens for an empty string', () => {
    expect(parseChatMarkup('')).toEqual([]);
  });
});

describe('fixChatMarkup', () => {
  it('trims spaces only inside paired single- and double-star markers', () => {
    expect(fixChatMarkup('* word * and ** bold **')).toBe('*word* and **bold**');
    expect(fixChatMarkup('She says *hello')).toBe('She says *hello');
  });

  it('leaves lines inside fenced blocks unchanged', () => {
    const input = [
      'Outside * spaced *',
      '```markdown',
      '* spaced *',
      '** word **',
      '```',
      'After ** spaced **',
    ].join('\n');
    const expected = [
      'Outside *spaced*',
      '```markdown',
      '* spaced *',
      '** word **',
      '```',
      'After **spaced**',
    ].join('\n');

    expect(fixChatMarkup(input)).toBe(expected);
  });
});
